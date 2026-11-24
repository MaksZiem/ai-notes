import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { NotesService } from '../notes/notes.service';
import { ProjectsService } from '../projects/projects.service';
import { hashPassword } from '../helpers/hash-password';
import { DEMO_EMAIL, DEMO_PASSWORD } from '../demo/demo-account';

type DemoNote = {
  title: string;
  content: string;
  keywords: string[];
  color: string;
  pinned?: boolean;
  favourite?: boolean;
};

const PROJECTS: {
  name: string;
  description: string;
  color: string;
  notes: DemoNote[];
}[] = [
  {
    name: 'Redesign strony głównej',
    description: 'Nowa strona główna sklepu: makiety, copy i plan wdrożenia',
    color: '#6366f1',
    notes: [
      {
        title: 'Wymagania',
        content:
          '# Wymagania\n\n- Hero z jednym, wyraźnym CTA\n- Sekcja bestsellerów pod hero\n- Czas ładowania poniżej 2 s na 4G\n- Pełna obsługa klawiatury i czytników ekranu\n\n## Poza zakresem\n\n- Nowy koszyk\n- Program lojalnościowy',
        keywords: ['WYMAGANIA', 'UX'],
        color: '#6366f1',
        pinned: true,
      },
      {
        title: 'Notatki ze spotkania z klientem',
        content:
          '# Spotkanie z klientem\n\nKlient chce prostszej nawigacji i mniej banerów. Najważniejsze są promocje sezonowe, ale mają być w jednym miejscu.\n\n**Decyzje:**\n\n1. Menu ma maksymalnie 5 pozycji.\n2. Baner promocyjny tylko w hero.\n3. Testy A/B przez dwa tygodnie po starcie.',
        keywords: ['SPOTKANIE', 'KLIENT'],
        color: '#f59e0b',
        favourite: true,
      },
      {
        title: 'Plan wdrożenia',
        content:
          '# Plan wdrożenia\n\n| Tydzień | Zadanie |\n|---|---|\n| 1 | Makiety i akceptacja |\n| 2 | Implementacja komponentów |\n| 3 | Testy i poprawki |\n| 4 | Wdrożenie i testy A/B |',
        keywords: ['PLAN', 'HARMONOGRAM'],
        color: '#10b981',
      },
    ],
  },
  {
    name: 'Nauka TypeScript',
    description: 'Notatki z kursu i ściągi',
    color: '#10b981',
    notes: [
      {
        title: 'Typy generyczne',
        content:
          '# Typy generyczne\n\nGeneryki pozwalają pisać kod niezależny od konkretnego typu:\n\n```ts\nfunction first<T>(items: T[]): T | undefined {\n  return items[0];\n}\n```\n\nOgraniczenia dodaje się przez `extends`, np. `<T extends { id: string }>`.',
        keywords: ['TYPESCRIPT', 'GENERYKI'],
        color: '#10b981',
      },
      {
        title: 'Utility types',
        content:
          '# Utility types\n\n- `Partial<T>` - wszystkie pola opcjonalne\n- `Pick<T, K>` - tylko wybrane pola\n- `Omit<T, K>` - wszystko poza wybranymi\n- `Record<K, V>` - słownik o znanych kluczach',
        keywords: ['TYPESCRIPT', 'ŚCIĄGA'],
        color: '#06b6d4',
        favourite: true,
      },
    ],
  },
];

const PRIVATE_NOTES: DemoNote[] = [
  {
    title: 'Lista zakupów',
    content: '- mleko owsiane\n- kawa\n- awokado\n- makaron pełnoziarnisty',
    keywords: ['ZAKUPY'],
    color: '#f43f5e',
    pinned: true,
  },
  {
    title: 'Pomysły na weekend',
    content:
      '# Weekend\n\n1. Wycieczka rowerowa nad jezioro\n2. Nowa książka z listy do przeczytania\n3. Wieczór z planszówkami',
    keywords: ['POMYSŁY'],
    color: '#8b5cf6',
  },
];

async function seedDemo() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const usersService = app.get(UsersService);
  const notesService = app.get(NotesService);
  const projectsService = app.get(ProjectsService);

  for (const existing of await usersService.find(DEMO_EMAIL)) {
    await usersService.remove(existing.id);
  }

  const user = await usersService.create(
    DEMO_EMAIL,
    await hashPassword(DEMO_PASSWORD),
    'Demo',
    'User',
  );

  const createNote = async (entry: DemoNote, projectId?: string) => {
    const { pinned, favourite, ...dto } = entry;
    const note = await notesService.create(
      { ...dto, projectId },
      user.id,
      user.role,
    );
    if (pinned) {
      await notesService.togglePin(note.id, null, user.id, user.role);
    }
    if (favourite) {
      await notesService.toggleFavourite(note.id, null, user.id, user.role);
    }
  };

  for (const { notes, ...project } of PROJECTS) {
    const created = await projectsService.create(project, user.id);
    for (const note of notes) {
      await createNote(note, created.id);
    }
  }
  for (const note of PRIVATE_NOTES) {
    await createNote(note);
  }

  console.log(`Demo account reset: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  await app.close();
}

seedDemo().catch((error) => {
  console.error('Demo seed failed:', error);
  process.exit(1);
});
