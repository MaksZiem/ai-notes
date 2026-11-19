import { ForbiddenException } from '@nestjs/common';
import { NotesService } from './notes.service';
import { Note } from './entities/note.entity';
import { AccessLevel } from 'src/enums/access-level.enum';
import { UserRole } from 'src/enums/user-role.enum';

function note(data: Partial<Note>): Note {
  return { id: 1, title: '', content: '', projectId: null, ...data } as Note;
}

describe('NotesService content and AI', () => {
  let noteRepo: { create: jest.Mock; save: jest.Mock; remove: jest.Mock };
  let projectsService: { findOne: jest.Mock };
  let aiService: { embedText: jest.Mock; answerFromContext: jest.Mock };
  let service: NotesService;

  beforeEach(() => {
    noteRepo = {
      create: jest.fn((data) => ({ ...data })),
      save: jest.fn((data) => Promise.resolve(data)),
      remove: jest.fn((data) => Promise.resolve(data)),
    };
    projectsService = { findOne: jest.fn() };
    aiService = {
      embedText: jest.fn().mockResolvedValue([0.1, 0.2]),
      answerFromContext: jest.fn().mockResolvedValue('The budget is 10k.'),
    };
    service = new NotesService(
      noteRepo as any,
      {} as any,
      {} as any,
      projectsService as any,
      {} as any,
      {} as any,
      aiService as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  describe('create', () => {
    it('makes the caller the owner and upper-cases keywords', async () => {
      const created = await service.create(
        { title: 'Plan', content: 'Q3', keywords: ['marketing', 'q3'] },
        10,
        UserRole.USER,
      );

      expect(created.ownerId).toBe(10);
      expect(created.projectId).toBeNull();
      expect(created.keywords).toEqual(['MARKETING', 'Q3']);
    });

    it('stores an embedding of the title and content for semantic search', async () => {
      const created = await service.create(
        { title: 'Plan', content: 'Q3 goals' },
        10,
        UserRole.USER,
      );

      expect(aiService.embedText).toHaveBeenCalledWith('Plan\n\nQ3 goals');
      expect(created.embedding).toEqual([0.1, 0.2]);
    });

    it('still saves the note when the embedding call fails', async () => {
      aiService.embedText.mockRejectedValue(new Error('Gemini is down'));

      const created = await service.create(
        { title: 'Plan', content: 'Q3' },
        10,
        UserRole.USER,
      );

      expect(noteRepo.save).toHaveBeenCalled();
      expect(created.embedding).toBeUndefined();
    });

    it('does not embed an empty note', async () => {
      await service.create({ title: '  ', content: '' }, 10, UserRole.USER);

      expect(aiService.embedText).not.toHaveBeenCalled();
    });

    it('requires EDIT access to the target project', async () => {
      projectsService.findOne.mockRejectedValue(new ForbiddenException());

      await expect(
        service.create({ title: 'Plan' }, 10, UserRole.USER, 3),
      ).rejects.toThrow(ForbiddenException);
      expect(projectsService.findOne).toHaveBeenCalledWith(
        3,
        10,
        UserRole.USER,
        AccessLevel.EDIT,
      );
      expect(noteRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('re-embeds the note when the text changes', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(note({ title: 'Old', content: 'Body' }));

      const updated = await service.update(
        1,
        { title: 'New' },
        null,
        10,
        UserRole.USER,
      );

      expect(updated.title).toBe('New');
      expect(aiService.embedText).toHaveBeenCalledWith('New\n\nBody');
    });

    it('does not call the AI when only the color changes', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(note({ title: 'Old', color: 'red' }));

      await service.update(1, { color: 'blue' }, null, 10, UserRole.USER);

      expect(aiService.embedText).not.toHaveBeenCalled();
    });
  });

  it('remove asks for DELETE access', async () => {
    const findOne = jest.spyOn(service, 'findOne').mockResolvedValue(note({}));

    await service.remove(1, null, 10, UserRole.USER);

    expect(findOne).toHaveBeenCalledWith(
      1,
      null,
      10,
      UserRole.USER,
      AccessLevel.DELETE,
    );
  });

  describe('semanticSearch', () => {
    beforeEach(() => {
      aiService.embedText.mockResolvedValue([1, 0]);
      jest.spyOn(service, 'findAllNotes').mockResolvedValue([
        note({ id: 1, title: 'Close', embedding: [0.9, 0.1], projectId: 3 }),
        note({ id: 2, title: 'Exact', embedding: [1, 0], projectId: 4 }),
        note({ id: 3, title: 'Unrelated', embedding: [0, 1], projectId: 3 }),
        note({ id: 4, title: 'Not indexed', embedding: null }),
      ]);
    });

    it('returns relevant notes sorted from the best match', async () => {
      const results = await service.semanticSearch('q', 10, UserRole.USER);

      expect(results.map((n) => n.title)).toEqual(['Exact', 'Close']);
    });

    it('can be limited to one project', async () => {
      const results = await service.semanticSearch('q', 10, UserRole.USER, 3);

      expect(results.map((n) => n.title)).toEqual(['Close']);
    });
  });

  describe('ragChat', () => {
    it('answers only from the found notes and returns them as sources', async () => {
      jest
        .spyOn(service, 'semanticSearch')
        .mockResolvedValue([note({ id: 7, title: 'Budget', content: '10k' })]);

      const result = await service.ragChat('Budget?', 10, UserRole.USER);

      expect(aiService.answerFromContext).toHaveBeenCalledWith('Budget?', [
        { id: 7, title: 'Budget', content: '10k' },
      ]);
      expect(result).toEqual({
        answer: 'The budget is 10k.',
        sources: [{ id: 7, title: 'Budget' }],
      });
    });

    it('uses at most 5 notes as context', async () => {
      jest
        .spyOn(service, 'semanticSearch')
        .mockResolvedValue(
          Array.from({ length: 8 }, (_, i) => note({ id: i, title: `N${i}` })),
        );

      const result = await service.ragChat('q', 10, UserRole.USER);

      expect(result.sources).toHaveLength(5);
    });

    it('does not call the model when no note matches', async () => {
      jest.spyOn(service, 'semanticSearch').mockResolvedValue([]);

      const result = await service.ragChat('q', 10, UserRole.USER);

      expect(aiService.answerFromContext).not.toHaveBeenCalled();
      expect(result.sources).toEqual([]);
    });
  });

  it('reindexEmbeddings skips empty notes and counts the rest', async () => {
    jest
      .spyOn(service, 'findAllNotes')
      .mockResolvedValue([
        note({ id: 1, title: 'A' }),
        note({ id: 2, title: ' ', content: '' }),
        note({ id: 3, content: 'Body' }),
      ]);

    const result = await service.reindexEmbeddings(10, UserRole.USER);

    expect(result).toEqual({ updated: 2 });
    expect(noteRepo.save).toHaveBeenCalledTimes(2);
  });
});
