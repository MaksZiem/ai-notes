import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type, type Content, type FunctionDeclaration, type Part } from '@google/genai';
import { NotesService } from 'src/notes/notes.service';
import { ProjectsService } from 'src/projects/projects.service';
import { User } from 'src/users/user.entity';
import { handleGeminiError } from 'src/helpers/handle-gemini-error';

const TOOLS: FunctionDeclaration[] = [
  {
    name: 'search_notes',
    description: 'Wyszukaj notatki użytkownika pasujące znaczeniowo do zapytania.',
    parameters: {
      type: Type.OBJECT,
      properties: { query: { type: Type.STRING } },
      required: ['query'],
    },
  },
  {
    name: 'get_note',
    description: 'Pobierz pełną treść notatki po jej ID.',
    parameters: {
      type: Type.OBJECT,
      properties: { id: { type: Type.INTEGER } },
      required: ['id'],
    },
  },
  {
    name: 'create_note',
    description: 'Utwórz nową notatkę.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        content: { type: Type.STRING },
        projectId: {
          type: Type.INTEGER,
          nullable: true,
          description: 'ID projektu, albo pomiń dla notatki prywatnej',
        },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'list_projects',
    description: 'Zwróć listę projektów użytkownika.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
];

export interface AgentStep {
  tool: string;
  args: unknown;
  result: unknown;
}

export interface AgentContext {
  noteId?: number;
  projectId?: number;
}

const UPDATE_CURRENT_NOTE_TOOL: FunctionDeclaration = {
  name: 'update_current_note',
  description: 'Zaktualizuj tytuł i/lub treść notatki, którą użytkownik ma obecnie otwartą w edytorze.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, nullable: true },
      content: { type: Type.STRING, nullable: true },
    },
  },
};

@Injectable()
export class AgentService {
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(
    private readonly config: ConfigService,
    private readonly notesService: NotesService,
    private readonly projectsService: ProjectsService
  ) {
    this.client = new GoogleGenAI({ apiKey: this.config.get<string>('GEMINI_API_KEY') });
    this.model = this.config.get<string>('GEMINI_MODEL') ?? 'gemini-3.6-flash';
  }

  async run(
    message: string,
    user: User,
    context?: AgentContext,
  ): Promise<{ answer: string; steps: AgentStep[] }> {
    try {
      return await this.runInternal(message, user, context);
    } catch (error) {
      handleGeminiError(error);
    }
  }

  private async runInternal(
    message: string,
    user: User,
    context?: AgentContext,
  ): Promise<{ answer: string; steps: AgentStep[] }> {
    const history: Content[] = [{ role: 'user', parts: [{ text: message }] }];
    const steps: AgentStep[] = [];

    let noteContext = '';
    if (context?.noteId) {
      const note = await this.notesService.findOne(
        context.noteId,
        context.projectId ?? null,
        user.id,
        user.role,
      );
      noteContext = `\n\nUżytkownik obecnie edytuje notatkę (id=${note.id}${note.projectId ? `, w projekcie ${note.projectId}` : ''}). Aktualny tytuł: "${note.title}". Aktualna treść:\n${note.content ?? '(pusta)'}`;
    }

    const tools = context?.noteId ? [...TOOLS, UPDATE_CURRENT_NOTE_TOOL] : TOOLS;
    const systemInstruction =
      'Jesteś asystentem notatnika. Masz dostęp do narzędzi pozwalających przeszukiwać, czytać i tworzyć notatki użytkownika. Używaj ich tylko wtedy, gdy naprawdę potrzebujesz informacji lub akcji, której nie masz już w kontekście — każde wywołanie narzędzia kosztuje osobne zapytanie do limitowanego API, więc unikaj zbędnych wywołań (np. nie szukaj/nie listuj czegoś, co już znasz z poniższego kontekstu). Odpowiadaj po polsku.' +
      noteContext;

    for (let i = 0; i < 6; i++) {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: history,
        config: {
          tools: [{ functionDeclarations: tools }],
          systemInstruction,
        },
      });

      const calls = response.functionCalls;
      if (!calls || calls.length === 0) {
        return { answer: response.text ?? '', steps };
      }

      // WAŻNE: pushujemy surowy content z odpowiedzi (nie odbudowujemy ręcznie
      // z response.functionCalls), bo tylko tak zachowujemy thoughtSignature —
      // bez niej kolejne wywołanie generateContent zwróci 400.
      history.push(response.candidates![0].content!);

      const responseParts: Part[] = [];
      for (const call of calls) {
        const result = await this.executeTool(call.name ?? '', call.args ?? {}, user, context);
        steps.push({ tool: call.name ?? '', args: call.args, result });
        responseParts.push({
          functionResponse: { name: call.name, response: { output: result } },
        });
      }
      history.push({ role: 'user', parts: responseParts });
    }

    return { answer: 'Nie udało się dokończyć zadania w rozsądnej liczbie kroków.', steps };
  }

  private async executeTool(
    name: string,
    args: Record<string, unknown>,
    user: User,
    context?: AgentContext,
  ): Promise<unknown> {
    switch (name) {
      case 'search_notes': {
        const results = await this.notesService.semanticSearch(String(args.query ?? ''), user.id, user.role);
        return results
          .slice(0, 5)
          .map((n) => ({ id: n.id, title: n.title, snippet: (n.content ?? '').slice(0, 200) }));
      }
      case 'get_note': {
        const note = await this.notesService.findOne(Number(args.id), null, user.id, user.role);
        return { id: note.id, title: note.title, content: note.content };
      }
      case 'create_note': {
        const note = await this.notesService.create(
          {
            title: String(args.title ?? 'Bez tytułu'),
            content: String(args.content ?? ''),
            projectId: args.projectId != null ? Number(args.projectId) : undefined,
          },
          user.id,
          user.role,
        );
        return { id: note.id, title: note.title };
      }
      case 'list_projects': {
        const projects = await this.projectsService.findAllByUser(user.id, user.role);
        return projects.map((p) => ({ id: p.id, name: p.name, description: p.description }));
      }
      case 'update_current_note': {
        if (!context?.noteId) {
          return { error: 'Brak aktywnej notatki do zaktualizowania.' };
        }
        const note = await this.notesService.update(
          context.noteId,
          {
            title: args.title as string | undefined,
            content: args.content as string | undefined,
          },
          context.projectId ?? null,
          user.id,
          user.role,
        );
        return { id: note.id, title: note.title, content: note.content };
      }
      default:
        return { error: `Nieznane narzędzie: ${name}` };
    }
  }
}