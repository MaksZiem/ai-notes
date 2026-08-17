import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type, type Content, type FunctionDeclaration, type Part } from '@google/genai';
import { NotesService } from 'src/notes/notes.service';
import { ProjectsService } from 'src/projects/projects.service';
import { User } from 'src/users/user.entity';

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
  args: unknown
}

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

  async run(message: string, user: User): Promise<{ answer: string; steps: AgentStep[] }> {
    const history: Content[] = [{ role: 'user', parts: [{ text: message }] }];
    const steps: AgentStep[] = [];

    for (let i = 0; i < 6; i++) {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: history,
        config: {
          tools: [{ functionDeclarations: TOOLS }],
          systemInstruction:
            'Jesteś asystentem notatnika. Masz dostęp do narzędzi pozwalających przeszukiwać, czytać i tworzyć notatki użytkownika. Używaj ich, gdy potrzebujesz informacji lub akcji. Odpowiadaj po polsku.',
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
        const result = await this.executeTool(call.name ?? '', call.args ?? {}, user);
        steps.push({ tool: call.name ?? '', args: call.args });
        responseParts.push({
          functionResponse: { name: call.name, response: { output: result } },
        });
      }
      history.push({ role: 'user', parts: responseParts });
    }

    return { answer: 'Nie udało się dokończyć zadania w rozsądnej liczbie kroków.', steps };
  }

  private async executeTool(name: string, args: Record<string, unknown>, user: User): Promise<unknown> {
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
      default:
        return { error: `Nieznane narzędzie: ${name}` };
    }
  }
}