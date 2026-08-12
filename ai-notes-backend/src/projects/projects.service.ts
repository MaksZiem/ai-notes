import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { In, Repository } from 'typeorm';
import { CreateProjectDto } from './dtos/create-project.dto';
import { UpdateProjectDto } from './dtos/update-project.dto';
import { UserRole } from 'src/enums/user-role.enum';
import { ProjectMember } from './entities/project-member.entity';
import { AccessLevel, hasAccess } from 'src/enums/access-level.enum';
import { GrantAccessDto } from './dtos/grant-access.dto';
import { UserProjectPreference } from './entities/project-user-preference.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private repo: Repository<Project>,
    @InjectRepository(ProjectMember)
    private memberRepo: Repository<ProjectMember>,
    @InjectRepository(UserProjectPreference)
    private prefRepo: Repository<UserProjectPreference>,
  ) {}

  async findAllByUser(
    callerId: number,
    callerRole: UserRole,
    filters?: { pinned?: boolean; favourite?: boolean },
  ): Promise<Project[]> {
    if (filters?.pinned || filters?.favourite) {
      const where: Partial<UserProjectPreference> = { userId: callerId };
      if (filters.pinned) where.isPinned = true;
      if (filters.favourite) where.isFavourite = true;

      const prefs = await this.prefRepo.find({
        where,
        select: ['projectId'],
      });
      const projectIds = prefs.map((p) => p.projectId);
      if (!projectIds.length) return [];

      return this.repo.find({
        where: { id: In(projectIds) },
        order: { updatedAt: 'DESC' },
      });
    }

    if (callerRole === UserRole.ADMIN) {
      return this.repo.find();
    }

    const memberships = await this.memberRepo.find({
      where: { userId: callerId },
      select: ['projectId'],
    });
    const sharedIds = memberships.map((m) => m.projectId);

    const qb = this.repo
      .createQueryBuilder('project')
      .where('project.ownerId = :callerId', { callerId });

    if (sharedIds.length) {
      qb.orWhere('project.id IN (:...sharedIds)', { sharedIds });
    }

    return qb.getMany();
  }

  /**
   * Zwraca projekt po ID bez sprawdzania uprawnień.
   * Używane wewnętrznie przez NotesService.
   */
  async findOneRaw(id: number): Promise<Project> {
    const project = await this.repo.findOneBy({ id });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async findOne(
    id: number,
    callerId: number,
    callerRole: UserRole,
    required: AccessLevel = AccessLevel.VIEW,
  ): Promise<Project> {
    const project = await this.repo.findOneBy({ id });
    if (!project) throw new NotFoundException('Project not found');

    if (callerRole === UserRole.ADMIN || project.ownerId === callerId) {
      return project;
    }

    const membership = await this.memberRepo.findOneBy({
      projectId: id,
      userId: callerId,
    });

    if (!membership) throw new ForbiddenException('Access denied');

    if (!hasAccess(membership.accessLevel, required)) {
      throw new ForbiddenException(
        `Required access level: ${required}, your level: ${membership.accessLevel}`,
      );
    }

    return project;
  }

  async findRecent(callerId: number, callerRole: UserRole) {
    if (callerRole === UserRole.ADMIN) {
      return this.repo.find({ order: { updatedAt: 'DESC' }, take: 5 });
    }

    const memberships = await this.memberRepo.find({
      where: { userId: callerId },
      select: ['projectId'],
    });
    const sharedIds = memberships.map((m) => m.projectId);

    const qb = this.repo
      .createQueryBuilder('project')
      .where('project.ownerId = :callerId', { callerId })
      .orderBy('project.updatedAt', 'DESC')
      .take(5);

    if (sharedIds.length) {
      qb.orWhere('project.id IN (:...sharedIds)', { sharedIds });
    }

    return qb.getMany();
  }

  create(dto: CreateProjectDto, ownerId: number): Promise<Project> {
    const project = this.repo.create({ ...dto, ownerId });
    return this.repo.save(project);
  }

  async update(
    id: number,
    dto: UpdateProjectDto,
    callerId: number,
    callerRole: UserRole,
  ): Promise<Project> {
    const project = await this.findOne(id, callerId, callerRole, AccessLevel.EDIT);
    Object.assign(project, dto);
    return this.repo.save(project);
  }

  async remove(
    id: number,
    callerId: number,
    callerRole: UserRole,
  ): Promise<Project> {
    const project = await this.findOne(id, callerId, callerRole, AccessLevel.DELETE);
    if (callerRole !== UserRole.ADMIN && project.ownerId !== callerId) {
      throw new ForbiddenException('Only the owner or admin can delete a project');
    }
    return this.repo.remove(project);
  }

  async togglePin(
    projectId: number,
    callerId: number,
    callerRole: UserRole,
  ): Promise<UserProjectPreference> {
    await this.findOne(projectId, callerId, callerRole);
    const pref = await this.getOrCreatePref(projectId, callerId);
    pref.isPinned = !pref.isPinned;
    return this.prefRepo.save(pref);
  }

  async toggleFavourite(
    projectId: number,
    callerId: number,
    callerRole: UserRole,
  ): Promise<UserProjectPreference> {
    await this.findOne(projectId, callerId, callerRole);
    const pref = await this.getOrCreatePref(projectId, callerId);
    pref.isFavourite = !pref.isFavourite; // fix: było isPinned
    return this.prefRepo.save(pref);
  }

  async grantAccess(
    projectId: number,
    callerId: number,
    callerRole: UserRole,
    dto: GrantAccessDto,
  ): Promise<ProjectMember> {
    await this.assertOwnerOrAdmin(projectId, callerId, callerRole);

    const existing = await this.memberRepo.findOneBy({
      projectId,
      userId: dto.userId,
    });

    if (existing) {
      existing.accessLevel = dto.accessLevel ?? existing.accessLevel;
      return this.memberRepo.save(existing);
    }

    const member = this.memberRepo.create({
      projectId,
      userId: dto.userId,
      accessLevel: dto.accessLevel ?? AccessLevel.VIEW,
    });

    return this.memberRepo.save(member);
  }

  async revokeAccess(
    projectId: number,
    targetUserId: number,
    callerId: number,
    callerRole: UserRole,
  ): Promise<void> {
    await this.assertOwnerOrAdmin(projectId, callerId, callerRole);
    await this.memberRepo.delete({ projectId, userId: targetUserId });
  }

  async listMembers(
    projectId: number,
    callerId: number,
    callerRole: UserRole,
  ): Promise<ProjectMember[]> {
    await this.findOne(projectId, callerId, callerRole);
    return this.memberRepo.find({
      where: { projectId },
      relations: ['user'],
    });
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  private async assertOwnerOrAdmin(
    projectId: number,
    callerId: number,
    callerRole: UserRole,
  ): Promise<void> {
    if (callerRole === UserRole.ADMIN) return;
    const project = await this.repo.findOneBy({ id: projectId });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== callerId)
      throw new ForbiddenException('Only the owner or admin can manage access');
  }

  private async getOrCreatePref(
    projectId: number,
    userId: number,
  ): Promise<UserProjectPreference> {
    let pref = await this.prefRepo.findOneBy({ projectId, userId });
    if (!pref) {
      pref = this.prefRepo.create({ projectId, userId });
      await this.prefRepo.save(pref);
    }
    return pref;
  }
}