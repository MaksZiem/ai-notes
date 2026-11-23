import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  HttpStatus,
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
import { assignDefined } from 'src/helpers/assign-defined';
import { ProjectShareLink } from './entities/project-share-link.entity';
import { CreateProjectShareLinkDto } from './dtos/create-project-share-link.dto';
import { MailService } from 'src/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  PROJECT_SHARED_EVENT,
  PROJECT_ACCESS_REVOKED_EVENT,
  PROJECT_SHARE_LINK_CLAIMED_EVENT,
  PROJECT_INVITE_EVENT,
  ProjectSharedEvent,
  ProjectAccessRevokedEvent,
  ProjectShareLinkClaimedEvent,
  ProjectInviteEvent,
} from 'src/notifications/notifications.events';
import { UsersService } from 'src/users/users.service';
import { errorBody } from '../common/error-body';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private repo: Repository<Project>,
    @InjectRepository(ProjectMember)
    private memberRepo: Repository<ProjectMember>,
    @InjectRepository(UserProjectPreference)
    private prefRepo: Repository<UserProjectPreference>,
    @InjectRepository(ProjectShareLink)
    private shareLinkRepo: Repository<ProjectShareLink>,
    private mailService: MailService,
    private config: ConfigService,
    private eventEmitter: EventEmitter2,
    private usersService: UsersService,
  ) {}

  async findAllByUser(
    callerId: string,
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

  async findOneRaw(id: string): Promise<Project> {
    const project = await this.repo.findOneBy({ id });
    if (!project)
      throw new NotFoundException(
        errorBody(
          HttpStatus.NOT_FOUND,
          'PROJECT_NOT_FOUND',
          'Project not found',
        ),
      );
    return project;
  }

  async findOne(
    id: string,
    callerId: string,
    callerRole: UserRole,
    required: AccessLevel = AccessLevel.VIEW,
  ): Promise<Project> {
    const project = await this.repo.findOneBy({ id });
    if (!project)
      throw new NotFoundException(
        errorBody(
          HttpStatus.NOT_FOUND,
          'PROJECT_NOT_FOUND',
          'Project not found',
        ),
      );

    if (callerRole === UserRole.ADMIN || project.ownerId === callerId) {
      return project;
    }

    const membership = await this.memberRepo.findOneBy({
      projectId: id,
      userId: callerId,
    });

    if (!membership)
      throw new ForbiddenException(
        errorBody(HttpStatus.FORBIDDEN, 'ACCESS_DENIED', 'Access denied'),
      );

    if (!hasAccess(membership.accessLevel, required)) {
      throw new ForbiddenException(
        errorBody(
          HttpStatus.FORBIDDEN,
          'ACCESS_LEVEL_REQUIRED',
          `Required access level: ${required}, your level: ${membership.accessLevel}`,
          { required, current: membership.accessLevel },
        ),
      );
    }

    return project;
  }

  async getAccessLevel(
    id: string,
    callerId: string,
    callerRole: UserRole,
  ): Promise<AccessLevel> {
    const project = await this.repo.findOneBy({ id });
    if (!project)
      throw new NotFoundException(
        errorBody(
          HttpStatus.NOT_FOUND,
          'PROJECT_NOT_FOUND',
          'Project not found',
        ),
      );

    if (callerRole === UserRole.ADMIN || project.ownerId === callerId) {
      return AccessLevel.DELETE;
    }

    const membership = await this.memberRepo.findOneBy({
      projectId: id,
      userId: callerId,
    });
    if (!membership)
      throw new ForbiddenException(
        errorBody(HttpStatus.FORBIDDEN, 'ACCESS_DENIED', 'Access denied'),
      );
    return membership.accessLevel;
  }

  async findRecent(callerId: string, callerRole: UserRole) {
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

  create(dto: CreateProjectDto, ownerId: string): Promise<Project> {
    const project = this.repo.create({ ...dto, ownerId });
    return this.repo.save(project);
  }

  async update(
    id: string,
    dto: UpdateProjectDto,
    callerId: string,
    callerRole: UserRole,
  ): Promise<Project> {
    const project = await this.findOne(
      id,
      callerId,
      callerRole,
      AccessLevel.EDIT,
    );
    assignDefined(project, dto);
    return this.repo.save(project);
  }

  async remove(
    id: string,
    callerId: string,
    callerRole: UserRole,
  ): Promise<Project> {
    const project = await this.findOne(
      id,
      callerId,
      callerRole,
      AccessLevel.DELETE,
    );
    if (callerRole !== UserRole.ADMIN && project.ownerId !== callerId) {
      throw new ForbiddenException(
        errorBody(
          HttpStatus.FORBIDDEN,
          'PROJECT_DELETE_OWNER_ONLY',
          'Only the owner or admin can delete a project',
        ),
      );
    }
    return this.repo.remove(project);
  }

  async togglePin(
    projectId: string,
    callerId: string,
    callerRole: UserRole,
  ): Promise<UserProjectPreference> {
    await this.findOne(projectId, callerId, callerRole);
    const pref = await this.getOrCreatePref(projectId, callerId);
    pref.isPinned = !pref.isPinned;
    return this.prefRepo.save(pref);
  }

  async toggleFavourite(
    projectId: string,
    callerId: string,
    callerRole: UserRole,
  ): Promise<UserProjectPreference> {
    await this.findOne(projectId, callerId, callerRole);
    const pref = await this.getOrCreatePref(projectId, callerId);
    pref.isFavourite = !pref.isFavourite;
    return this.prefRepo.save(pref);
  }

  async grantAccess(
    projectId: string,
    callerId: string,
    callerRole: UserRole,
    dto: GrantAccessDto,
  ): Promise<ProjectMember> {
    await this.assertOwnerOrAdmin(projectId, callerId, callerRole);

    const existing = await this.memberRepo.findOneBy({
      projectId,
      userId: dto.userId,
    });

    let saved: ProjectMember;
    if (existing) {
      existing.accessLevel = dto.accessLevel ?? existing.accessLevel;
      saved = await this.memberRepo.save(existing);
    } else {
      const member = this.memberRepo.create({
        projectId,
        userId: dto.userId,
        accessLevel: dto.accessLevel ?? AccessLevel.VIEW,
      });
      saved = await this.memberRepo.save(member);
    }

    this.eventEmitter.emit(
      PROJECT_SHARED_EVENT,
      new ProjectSharedEvent(
        projectId,
        dto.userId,
        callerId,
        saved.accessLevel,
      ),
    );

    return saved;
  }

  async revokeAccess(
    projectId: string,
    targetUserId: string,
    callerId: string,
    callerRole: UserRole,
  ): Promise<void> {
    await this.assertOwnerOrAdmin(projectId, callerId, callerRole);
    await this.memberRepo.delete({ projectId, userId: targetUserId });
    this.eventEmitter.emit(
      PROJECT_ACCESS_REVOKED_EVENT,
      new ProjectAccessRevokedEvent(projectId, targetUserId, callerId),
    );
  }

  async listMembers(
    projectId: string,
    callerId: string,
    callerRole: UserRole,
  ): Promise<ProjectMember[]> {
    await this.findOne(projectId, callerId, callerRole);
    return this.memberRepo.find({
      where: { projectId },
      relations: ['user'],
    });
  }

  async leaveProject(projectId: string, callerId: string): Promise<void> {
    const project = await this.repo.findOneBy({ id: projectId });
    if (!project)
      throw new NotFoundException(
        errorBody(
          HttpStatus.NOT_FOUND,
          'PROJECT_NOT_FOUND',
          'Project not found',
        ),
      );
    if (project.ownerId === callerId) {
      throw new ForbiddenException(
        errorBody(
          HttpStatus.FORBIDDEN,
          'OWNER_CANNOT_LEAVE_PROJECT',
          'The owner cannot leave their own project; they can delete it',
        ),
      );
    }

    const result = await this.memberRepo.delete({
      projectId,
      userId: callerId,
    });
    if (!result.affected) {
      throw new ForbiddenException(
        errorBody(
          HttpStatus.FORBIDDEN,
          'NO_DIRECT_PROJECT_ACCESS',
          'You have no direct access to this project',
        ),
      );
    }
  }

  async createShareLink(
    projectId: string,
    callerId: string,
    callerRole: UserRole,
    dto: CreateProjectShareLinkDto,
  ): Promise<ProjectShareLink> {
    await this.assertOwnerOrAdmin(projectId, callerId, callerRole);

    const token = randomBytes(32).toString('hex');
    const expiresAt = dto.expiresInDays
      ? new Date(Date.now() + dto.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const link = this.shareLinkRepo.create({
      projectId,
      token,
      accessLevel: dto.accessLevel ?? AccessLevel.VIEW,
      email: dto.email ?? null,
      expiresAt,
      createdByUserId: callerId,
    });

    const saved = await this.shareLinkRepo.save(link);

    if (dto.email) {
      const project = await this.repo.findOneBy({ id: projectId });
      const frontendUrl = this.config.get<string>('FRONTEND_URL');
      const shareUrl = `${frontendUrl}/project-invites/${token}`;
      await this.mailService.sendProjectShareEmail(
        dto.email,
        project?.name ?? 'Projekt',
        shareUrl,
      );

      const [invitedUser] = await this.usersService.find(dto.email);
      if (invitedUser) {
        this.eventEmitter.emit(
          PROJECT_INVITE_EVENT,
          new ProjectInviteEvent(
            projectId,
            saved.id,
            invitedUser.id,
            callerId,
            saved.accessLevel,
          ),
        );
      }
    }

    return saved;
  }

  async listShareLinks(
    projectId: string,
    callerId: string,
    callerRole: UserRole,
  ): Promise<ProjectShareLink[]> {
    await this.assertOwnerOrAdmin(projectId, callerId, callerRole);
    return this.shareLinkRepo.find({
      where: { projectId, revoked: false },
      order: { createdAt: 'DESC' },
    });
  }

  async revokeShareLink(
    projectId: string,
    linkId: string,
    callerId: string,
    callerRole: UserRole,
  ): Promise<void> {
    await this.assertOwnerOrAdmin(projectId, callerId, callerRole);
    await this.shareLinkRepo.update(
      { id: linkId, projectId },
      { revoked: true },
    );
  }

  async revokeShareLinkById(linkId: string): Promise<void> {
    await this.shareLinkRepo.update({ id: linkId }, { revoked: true });
  }

  private async resolveShareLink(token: string): Promise<ProjectShareLink> {
    const link = await this.shareLinkRepo.findOneBy({ token });
    if (!link || link.revoked) {
      throw new ForbiddenException(
        errorBody(
          HttpStatus.FORBIDDEN,
          'SHARE_LINK_INVALID',
          'The link is invalid or revoked',
        ),
      );
    }
    if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
      throw new ForbiddenException(
        errorBody(
          HttpStatus.FORBIDDEN,
          'SHARE_LINK_EXPIRED',
          'The link has expired',
        ),
      );
    }
    return link;
  }

  async getSharedProject(token: string): Promise<{
    project: { id: string; name: string; description?: string };
    invitedBy: { name: string; surname: string } | null;
    accessLevel: AccessLevel;
  }> {
    const link = await this.resolveShareLink(token);
    const project = await this.repo.findOneBy({ id: link.projectId });
    if (!project)
      throw new NotFoundException(
        errorBody(
          HttpStatus.NOT_FOUND,
          'PROJECT_NOT_FOUND',
          'Project not found',
        ),
      );
    const inviter = await this.usersService.findOne(link.createdByUserId);
    return {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
      },
      invitedBy: inviter
        ? { name: inviter.name, surname: inviter.surname }
        : null,
      accessLevel: link.accessLevel,
    };
  }

  async claimShareLink(token: string, userId: string): Promise<ProjectMember> {
    const link = await this.resolveShareLink(token);
    const existing = await this.memberRepo.findOneBy({
      projectId: link.projectId,
      userId,
    });

    let saved: ProjectMember;
    if (existing) {
      existing.accessLevel = link.accessLevel;
      saved = await this.memberRepo.save(existing);
    } else {
      const member = this.memberRepo.create({
        projectId: link.projectId,
        userId,
        accessLevel: link.accessLevel,
      });
      saved = await this.memberRepo.save(member);
    }

    const project = await this.repo.findOneBy({ id: link.projectId });
    if (project) {
      this.eventEmitter.emit(
        PROJECT_SHARE_LINK_CLAIMED_EVENT,
        new ProjectShareLinkClaimedEvent(
          link.projectId,
          project.ownerId,
          userId,
          link.id,
        ),
      );
    }

    return saved;
  }

  private async assertOwnerOrAdmin(
    projectId: string,
    callerId: string,
    callerRole: UserRole,
  ): Promise<void> {
    if (callerRole === UserRole.ADMIN) return;
    const project = await this.repo.findOneBy({ id: projectId });
    if (!project)
      throw new NotFoundException(
        errorBody(
          HttpStatus.NOT_FOUND,
          'PROJECT_NOT_FOUND',
          'Project not found',
        ),
      );
    if (project.ownerId !== callerId)
      throw new ForbiddenException(
        errorBody(
          HttpStatus.FORBIDDEN,
          'PROJECT_ACCESS_OWNER_ONLY',
          'Only the owner or admin can manage access',
        ),
      );
  }

  private async getOrCreatePref(
    projectId: string,
    userId: string,
  ): Promise<UserProjectPreference> {
    let pref = await this.prefRepo.findOneBy({ projectId, userId });
    if (!pref) {
      pref = this.prefRepo.create({ projectId, userId });
      await this.prefRepo.save(pref);
    }
    return pref;
  }
}
