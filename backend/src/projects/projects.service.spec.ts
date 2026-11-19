import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { AccessLevel } from 'src/enums/access-level.enum';
import { UserRole } from 'src/enums/user-role.enum';

describe('ProjectsService.getAccessLevel', () => {
  let projectRepo: { findOneBy: jest.Mock };
  let memberRepo: { findOneBy: jest.Mock };
  let service: ProjectsService;

  beforeEach(() => {
    projectRepo = { findOneBy: jest.fn() };
    memberRepo = { findOneBy: jest.fn() };
    service = new ProjectsService(
      projectRepo as any,
      memberRepo as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  it('gives the owner full access', async () => {
    projectRepo.findOneBy.mockResolvedValue({ id: 1, ownerId: 10 });

    const level = await service.getAccessLevel(1, 10, UserRole.USER);

    expect(level).toBe(AccessLevel.DELETE);
  });

  it('gives an admin full access to any project', async () => {
    projectRepo.findOneBy.mockResolvedValue({ id: 1, ownerId: 10 });

    const level = await service.getAccessLevel(1, 99, UserRole.ADMIN);

    expect(level).toBe(AccessLevel.DELETE);
  });

  it('returns the access level of a member', async () => {
    projectRepo.findOneBy.mockResolvedValue({ id: 1, ownerId: 10 });
    memberRepo.findOneBy.mockResolvedValue({ accessLevel: AccessLevel.VIEW });

    const level = await service.getAccessLevel(1, 20, UserRole.USER);

    expect(level).toBe(AccessLevel.VIEW);
    expect(memberRepo.findOneBy).toHaveBeenCalledWith({
      projectId: 1,
      userId: 20,
    });
  });

  it('blocks a stranger', async () => {
    projectRepo.findOneBy.mockResolvedValue({ id: 1, ownerId: 10 });
    memberRepo.findOneBy.mockResolvedValue(null);

    await expect(
      service.getAccessLevel(1, 30, UserRole.USER),
    ).rejects.toThrow(ForbiddenException);
  });

  it('returns 404 when the project does not exist', async () => {
    projectRepo.findOneBy.mockResolvedValue(null);

    await expect(
      service.getAccessLevel(1, 10, UserRole.USER),
    ).rejects.toThrow(NotFoundException);
  });
});
