import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotesService } from './notes.service';
import { AccessLevel } from 'src/enums/access-level.enum';
import { UserRole } from 'src/enums/user-role.enum';

describe('NotesService.getAccessLevel', () => {
  let noteRepo: { findOne: jest.Mock };
  let memberRepo: { findOneBy: jest.Mock };
  let projectsService: { getAccessLevel: jest.Mock };
  let service: NotesService;

  beforeEach(() => {
    noteRepo = { findOne: jest.fn() };
    memberRepo = { findOneBy: jest.fn() };
    projectsService = { getAccessLevel: jest.fn() };
    service = new NotesService(
      noteRepo as any,
      memberRepo as any,
      {} as any,
      projectsService as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  it('gives the owner full access', async () => {
    noteRepo.findOne.mockResolvedValue({ id: 5, ownerId: 10, projectId: null });

    const level = await service.getAccessLevel(5, null, 10, UserRole.USER);

    expect(level).toBe(AccessLevel.DELETE);
  });

  it('gives an admin full access to any note', async () => {
    noteRepo.findOne.mockResolvedValue({ id: 5, ownerId: 10, projectId: null });

    const level = await service.getAccessLevel(5, null, 99, UserRole.ADMIN);

    expect(level).toBe(AccessLevel.DELETE);
  });

  it('inherits access from the project', async () => {
    noteRepo.findOne.mockResolvedValue({ id: 5, ownerId: 10, projectId: 3 });
    projectsService.getAccessLevel.mockResolvedValue(AccessLevel.EDIT);

    const level = await service.getAccessLevel(5, null, 20, UserRole.USER);

    expect(level).toBe(AccessLevel.EDIT);
    expect(projectsService.getAccessLevel).toHaveBeenCalledWith(
      3,
      20,
      UserRole.USER,
    );
    expect(memberRepo.findOneBy).not.toHaveBeenCalled();
  });

  it('falls back to direct note membership when the project denies access', async () => {
    noteRepo.findOne.mockResolvedValue({ id: 5, ownerId: 10, projectId: 3 });
    projectsService.getAccessLevel.mockRejectedValue(new ForbiddenException());
    memberRepo.findOneBy.mockResolvedValue({ accessLevel: AccessLevel.VIEW });

    const level = await service.getAccessLevel(5, null, 20, UserRole.USER);

    expect(level).toBe(AccessLevel.VIEW);
    expect(memberRepo.findOneBy).toHaveBeenCalledWith({ noteId: 5, userId: 20 });
  });

  it('uses direct membership for a private note', async () => {
    noteRepo.findOne.mockResolvedValue({ id: 5, ownerId: 10, projectId: null });
    memberRepo.findOneBy.mockResolvedValue({ accessLevel: AccessLevel.EDIT });

    const level = await service.getAccessLevel(5, null, 20, UserRole.USER);

    expect(level).toBe(AccessLevel.EDIT);
    expect(projectsService.getAccessLevel).not.toHaveBeenCalled();
  });

  it('blocks a user without any access', async () => {
    noteRepo.findOne.mockResolvedValue({ id: 5, ownerId: 10, projectId: 3 });
    projectsService.getAccessLevel.mockRejectedValue(new ForbiddenException());
    memberRepo.findOneBy.mockResolvedValue(null);

    await expect(
      service.getAccessLevel(5, null, 30, UserRole.USER),
    ).rejects.toThrow(ForbiddenException);
  });

  it('looks the note up inside the given project', async () => {
    noteRepo.findOne.mockResolvedValue({ id: 5, ownerId: 10, projectId: 3 });

    await service.getAccessLevel(5, 3, 10, UserRole.USER);

    expect(noteRepo.findOne).toHaveBeenCalledWith({
      where: { id: 5, projectId: 3 },
    });
  });

  it('returns 404 when the note does not exist', async () => {
    noteRepo.findOne.mockResolvedValue(null);

    await expect(
      service.getAccessLevel(5, null, 10, UserRole.USER),
    ).rejects.toThrow(NotFoundException);
  });
});
