import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NoteMember } from './entities/note-member.entity';
import { ILike, In, IsNull, Repository } from 'typeorm';
import { ProjectsService } from 'src/projects/projects.service';
import { CreateNoteDto } from './dtos/create-note.dto';
import { UpdateNoteDto } from './dtos/update-note.dto';
import { AccessLevel, hasAccess } from 'src/enums/access-level.enum';
import { UserRole } from 'src/enums/user-role.enum';
import { GrantAccessDto } from 'src/projects/dtos/grant-access.dto';
import { ProjectMember } from 'src/projects/entities/project-member.entity';
import { UserNotePreference } from './entities/note-user-preference.entity';
import { Note } from './entities/note.entity';
import { assignDefined } from 'src/helpers/assign-defined';
import { AiService } from 'src/ai/ai.service';
import { cosineSimilarity } from 'src/helpers/cosine-similarity';
import { NoteShareLink } from './entities/note-share-link.entity';
import { CreateShareLinkDto } from './dtos/create-share-link.dto';
import { MailService } from 'src/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NOTE_SHARED_EVENT,
  NOTE_ACCESS_REVOKED_EVENT,
  SHARE_LINK_CLAIMED_EVENT,
  NOTE_INVITE_EVENT,
  NoteSharedEvent,
  NoteAccessRevokedEvent,
  ShareLinkClaimedEvent,
  NoteInviteEvent,
} from 'src/notifications/notifications.events';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note) private repo: Repository<Note>,
    @InjectRepository(NoteMember) private memberRepo: Repository<NoteMember>,
    @InjectRepository(NoteShareLink)
    private shareLinkRepo: Repository<NoteShareLink>,
    private projectsService: ProjectsService,
    @InjectRepository(ProjectMember)
    private projectMemberRepo: Repository<ProjectMember>,
    @InjectRepository(UserNotePreference)
    private notePrefRepo: Repository<UserNotePreference>,
    private aiService: AiService,
    private mailService: MailService,
    private config: ConfigService,
    private eventEmitter: EventEmitter2,
    private usersService: UsersService,
  ) {}

  // ── findAll w projekcie ───────────────────────────────────────────────────

  async findAllNotesInProject(
    projectId: number,
    callerId: number,
    callerRole: UserRole,
    filters?: { pinned?: boolean; favourite?: boolean },
  ): Promise<Note[]> {
    await this.projectsService.findOne(
      projectId,
      callerId,
      callerRole,
      AccessLevel.VIEW,
    );

    if (filters?.pinned || filters?.favourite) {
      const where: Partial<UserNotePreference> = { userId: callerId };
      if (filters.pinned) where.isPinned = true;
      if (filters.favourite) where.isFavourite = true;

      const prefs = await this.notePrefRepo.find({ where, select: ['noteId'] });
      const noteIds = prefs.map((p) => p.noteId);
      if (!noteIds.length) return [];

      return this.repo.find({
        where: { id: In(noteIds), projectId },
        order: { updatedAt: 'DESC' },
      });
    }

    return this.repo.find({
      where: { projectId },
      order: { updatedAt: 'DESC' },
    });
  }

  // ── findAll globalnie (wszystkie notatki użytkownika) ────────────────────

  async findAllNotes(
    callerId: number,
    callerRole: UserRole,
    filters?: { pinned?: boolean; favourite?: boolean },
    limit?: number,
    search?: string,
  ): Promise<Note[]> {
    // helper — dodaje warunki wyszukiwania do każdego warunku where
    const withSearch = (conditions: object[]) => {
      if (!search) return conditions;
      const term = ILike(`%${search}%`);
      return conditions.flatMap((w) => [
        { ...w, title: term },
        { ...w, content: term },
        { ...w, keywords: term },
      ]);
    };

    if (callerRole === UserRole.ADMIN) {
      return this.repo.find({
        where: search
          ? [
              { title: ILike(`%${search}%`) },
              { content: ILike(`%${search}%`) },
              { keywords: ILike(`%${search}%`) },
            ]
          : undefined,
        order: { updatedAt: 'DESC' },
        relations: ['project'],
        ...(limit ? { take: limit } : {}),
      });
    }

    // notatki dostępne przez projekt
    const memberships = await this.projectMemberRepo.find({
      where: { userId: callerId },
      select: ['projectId'],
    });
    const projectIds = memberships.map((m) => m.projectId);

    // notatki z bezpośrednim dostępem (NoteMember)
    const noteMembers = await this.memberRepo.find({
      where: { userId: callerId },
      select: ['noteId'],
    });
    const directNoteIds = noteMembers.map((m) => m.noteId);

    const baseWhere = [
      // notatki bez projektu, których jest właścicielem
      { ownerId: callerId, projectId: IsNull() },
      // notatki w projektach, które posiada
      { project: { ownerId: callerId } },
      // notatki w projektach, do których ma dostęp jako member
      ...(projectIds.length ? [{ projectId: In(projectIds) }] : []),
      // notatki z bezpośrednim wpisem NoteMember
      ...(directNoteIds.length ? [{ id: In(directNoteIds) }] : []),
    ];

    const where = withSearch(baseWhere);

    if (filters?.pinned || filters?.favourite) {
      const prefWhere: Partial<UserNotePreference> = { userId: callerId };
      if (filters.pinned) prefWhere.isPinned = true;
      if (filters.favourite) prefWhere.isFavourite = true;

      const prefs = await this.notePrefRepo.find({
        where: prefWhere,
        select: ['noteId'],
      });
      const prefNoteIds = prefs.map((p) => p.noteId);
      if (!prefNoteIds.length) return [];

      return this.repo.find({
        where: where.map((w) => ({ ...w, id: In(prefNoteIds) })),
        order: { updatedAt: 'DESC' },
        relations: ['project'],
        ...(limit ? { take: limit } : {}),
      });
    }

    return this.repo.find({
      where,
      order: { updatedAt: 'DESC' },
      relations: ['project'],
      ...(limit ? { take: limit } : {}),
    });
  }

  // ── findRecent ────────────────────────────────────────────────────────────

  // async findRecent(
  //   callerId: number,
  //   callerRole: UserRole,
  //   limit = 5,
  // ): Promise<Note[]> {
  //   if (callerRole === UserRole.ADMIN) {
  //     return this.repo.find({
  //       order: { updatedAt: 'DESC' },
  //       take: limit,
  //       relations: ['project'],
  //     });
  //   }

  //   const memberships = await this.projectMemberRepo.find({
  //     where: { userId: callerId },
  //     select: ['projectId'],
  //   });
  //   const projectIds = memberships.map((m) => m.projectId);

  //   return this.repo.find({
  //     where: [
  //       { ownerId: callerId, projectId: IsNull() },
  //       { project: { ownerId: callerId } },
  //       ...(projectIds.length ? [{ projectId: In(projectIds) }] : []),
  //     ],
  //     order: { updatedAt: 'DESC' },
  //     take: limit,
  //     relations: ['project'],
  //   });
  // }

  // ── findOne (bramka dostępu) ───────────────────────────────────────────────

  /**
   * Zwraca notatkę jeśli caller ma wymagany poziom dostępu.
   *
   * Notatka BEZ projektu (projectId = null):
   *   - ADMIN → zawsze OK
   *   - ownerId === callerId → zawsze OK
   *   - wpis NoteMember z wymaganym poziomem → OK
   *
   * Notatka Z projektem:
   *   - dostęp przez projekt (owner / admin / project member) → OK
   *   - LUB bezpośredni wpis NoteMember → OK
   */
  async findOne(
    id: number,
    projectId: number | null,
    callerId: number,
    callerRole: UserRole,
    required: AccessLevel = AccessLevel.VIEW,
  ): Promise<Note> {
    const note = await this.repo.findOne({
      where: projectId != null ? { id, projectId } : { id },
      relations: ['owner'],
    });
    if (!note) throw new NotFoundException('Note not found');

    // ── notatka bez projektu ──────────────────────────────────────────────
    if (!note.projectId) {
      if (callerRole === UserRole.ADMIN || note.ownerId === callerId) {
        return note;
      }

      const membership = await this.memberRepo.findOneBy({
        noteId: id,
        userId: callerId,
      });
      if (!membership) throw new ForbiddenException('Access denied');
      if (!hasAccess(membership.accessLevel, required)) {
        throw new ForbiddenException(
          `Required access level: ${required}, your level: ${membership.accessLevel}`,
        );
      }
      return note;
    }

    // ── notatka z projektem ───────────────────────────────────────────────
    try {
      await this.projectsService.findOne(
        note.projectId,
        callerId,
        callerRole,
        required,
      );
      return note;
    } catch {
      // brak dostępu przez projekt → sprawdź NoteMember
    }

    const membership = await this.memberRepo.findOneBy({
      noteId: id,
      userId: callerId,
    });
    if (!membership) throw new ForbiddenException('Access denied');
    if (!hasAccess(membership.accessLevel, required)) {
      throw new ForbiddenException(
        `Required access level: ${required}, your level: ${membership.accessLevel}`,
      );
    }

    return note;
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async create(
    dto: CreateNoteDto,
    callerId: number,
    callerRole: UserRole,
    projectId?: number,
  ): Promise<Note> {
    const resolvedProjectId = projectId ?? dto.projectId ?? null;

    if (resolvedProjectId != null) {
      // notatka w projekcie — wymagany EDIT na projekcie
      await this.projectsService.findOne(
        resolvedProjectId,
        callerId,
        callerRole,
        AccessLevel.EDIT,
      );
    }

    const note = this.repo.create({
      ...dto,
      keywords: dto.keywords?.map((k) => k.toUpperCase()),
      projectId: resolvedProjectId,
      ownerId: callerId,
    });
    if (note.title?.trim() || note.content?.trim()) {
      try {
        note.embedding = await this.aiService.embedText(
          `${note.title}\n\n${note.content ?? ''}`,
        );
      } catch {}
    }
    return this.repo.save(note);
  }

  async update(
    id: number,
    dto: UpdateNoteDto,
    projectId: number | null,
    callerId: number,
    callerRole: UserRole,
  ): Promise<Note> {
    const note = await this.findOne(
      id,
      projectId,
      callerId,
      callerRole,
      AccessLevel.EDIT,
    );
    if (dto.keywords) {
      dto.keywords = dto.keywords.map((k) => k.toUpperCase());
    }
    assignDefined(note, dto);
    if (dto.title !== undefined || dto.content !== undefined) {
      try {
        note.embedding = await this.aiService.embedText(
          `${note.title}\n\n${note.content ?? ''}`,
        );
      } catch {}
    }
    return this.repo.save(note);
  }

  async remove(
    id: number,
    projectId: number | null,
    callerId: number,
    callerRole: UserRole,
  ): Promise<Note> {
    const note = await this.findOne(
      id,
      projectId,
      callerId,
      callerRole,
      AccessLevel.DELETE,
    );
    return this.repo.remove(note);
  }

  // ── pin / favourite ───────────────────────────────────────────────────────

  async togglePin(
    noteId: number,
    projectId: number | null,
    callerId: number,
    callerRole: UserRole,
  ): Promise<UserNotePreference> {
    await this.findOne(noteId, projectId, callerId, callerRole);
    const pref = await this.getOrCreateNotePref(noteId, callerId);
    pref.isPinned = !pref.isPinned;
    return this.notePrefRepo.save(pref);
  }

  async toggleFavourite(
    noteId: number,
    projectId: number | null,
    callerId: number,
    callerRole: UserRole,
  ): Promise<UserNotePreference> {
    await this.findOne(noteId, projectId, callerId, callerRole);
    const pref = await this.getOrCreateNotePref(noteId, callerId);
    pref.isFavourite = !pref.isFavourite;
    return this.notePrefRepo.save(pref);
  }

  // ── members ───────────────────────────────────────────────────────────────

  async grantAccess(
    noteId: number,
    projectId: number | null,
    callerId: number,
    callerRole: UserRole,
    dto: GrantAccessDto,
  ): Promise<NoteMember> {
    await this.assertNoteOwnerOrAdmin(noteId, projectId, callerId, callerRole);

    const existing = await this.memberRepo.findOneBy({
      noteId,
      userId: dto.userId,
    });

    let saved: NoteMember;
    if (existing) {
      existing.accessLevel = dto.accessLevel ?? existing.accessLevel;
      saved = await this.memberRepo.save(existing);
    } else {
      const member = this.memberRepo.create({
        noteId,
        userId: dto.userId,
        accessLevel: dto.accessLevel ?? AccessLevel.VIEW,
      });
      saved = await this.memberRepo.save(member);
    }

    this.eventEmitter.emit(
      NOTE_SHARED_EVENT,
      new NoteSharedEvent(noteId, dto.userId, callerId, saved.accessLevel),
    );

    return saved;
  }

  async revokeAccess(
    noteId: number,
    projectId: number | null,
    targetUserId: number,
    callerId: number,
    callerRole: UserRole,
  ): Promise<void> {
    await this.assertNoteOwnerOrAdmin(noteId, projectId, callerId, callerRole);
    await this.memberRepo.delete({ noteId, userId: targetUserId });
    this.eventEmitter.emit(
      NOTE_ACCESS_REVOKED_EVENT,
      new NoteAccessRevokedEvent(noteId, targetUserId, callerId),
    );
  }

  async listMembers(
    noteId: number,
    projectId: number | null,
    callerId: number,
    callerRole: UserRole,
  ): Promise<NoteMember[]> {
    await this.findOne(noteId, projectId, callerId, callerRole);
    return this.memberRepo.find({ where: { noteId }, relations: ['user'] });
  }

  async leaveNote(
    noteId: number,
    projectId: number | null,
    callerId: number,
  ): Promise<void> {
    const note = await this.repo.findOneBy(
      projectId != null ? { id: noteId, projectId } : { id: noteId },
    );
    if (!note) throw new NotFoundException('Note not found');
    if (note.ownerId === callerId) {
      throw new ForbiddenException(
        'Właściciel nie może opuścić własnej notatki — może ją usunąć',
      );
    }

    const result = await this.memberRepo.delete({ noteId, userId: callerId });
    if (!result.affected) {
      throw new ForbiddenException(
        'Nie masz bezpośredniego dostępu do tej notatki',
      );
    }
  }

  // ── helpers ───────────────────────────────────────────────────────────────

  /**
   * Sprawdza czy caller może zarządzać dostępem do notatki:
   *   - ADMIN → zawsze OK
   *   - notatka bez projektu → musi być ownerId notatki
   *   - notatka z projektem → musi być właścicielem projektu
   */
  private async assertNoteOwnerOrAdmin(
    noteId: number,
    projectId: number | null,
    callerId: number,
    callerRole: UserRole,
  ): Promise<void> {
    if (callerRole === UserRole.ADMIN) return;

    const note = await this.repo.findOneBy({ id: noteId });
    if (!note) throw new NotFoundException('Note not found');

    if (!note.projectId) {
      // notatka bez projektu — tylko jej owner może zarządzać dostępem
      if (note.ownerId !== callerId) {
        throw new ForbiddenException(
          'Only the note owner or admin can manage note access',
        );
      }
      return;
    }

    // notatka z projektem — tylko właściciel projektu może zarządzać dostępem
    const project = await this.projectsService.findOneRaw(note.projectId);
    if (project.ownerId !== callerId) {
      throw new ForbiddenException(
        'Only the project owner or admin can manage note access',
      );
    }
  }

  private async getOrCreateNotePref(
    noteId: number,
    userId: number,
  ): Promise<UserNotePreference> {
    let pref = await this.notePrefRepo.findOneBy({ noteId, userId });
    if (!pref) {
      pref = this.notePrefRepo.create({ noteId, userId });
      await this.notePrefRepo.save(pref);
    }
    return pref;
  }

  async ragChat(
    question: string,
    callerId: number,
    callerRole: UserRole,
  ): Promise<{ answer: string; sources: { id: number; title: string }[] }> {
    const relevant = await this.semanticSearch(question, callerId, callerRole);
    const topNotes = relevant.slice(0, 5);

    if (topNotes.length === 0) {
      return {
        answer: 'Nie znalazłem żadnych notatek pasujących do tego pytania.',
        sources: [],
      };
    }

    const answer = await this.aiService.answerFromContext(
      question,
      topNotes.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content ?? '',
      })),
    );

    return {
      answer,
      sources: topNotes.map((n) => ({ id: n.id, title: n.title })),
    };
  }

  async semanticSearch(
    query: string,
    callerId: number,
    callerRole: UserRole,
    projectId?: number,
  ): Promise<Note[]> {
    const queryEmbedding = await this.aiService.embedText(query);
    const candidates = await this.findAllNotes(callerId, callerRole);

    return candidates
      .filter(
        (n) => n.embedding && (projectId == null || n.projectId === projectId),
      )
      .map((n) => ({
        note: n,
        score: cosineSimilarity(queryEmbedding, n.embedding as number[]),
      }))
      .filter((s) => s.score > 0.5)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)
      .map((s) => s.note);
  }

  async reindexEmbeddings(
    callerId: number,
    callerRole: UserRole,
  ): Promise<{ updated: number }> {
    const notes = await this.findAllNotes(callerId, callerRole);
    let updated = 0;
    for (const note of notes) {
      if (!note.title?.trim() && !note.content?.trim()) continue;
      try {
        note.embedding = await this.aiService.embedText(
          `${note.title}\n\n${note.content ?? ''}`,
        );
        await this.repo.save(note);
        updated++;
      } catch {
        // pomijamy notatkę, spróbujemy przy następnym zapisie
      }
    }
    return { updated };
  }

  async createShareLink(
    noteId: number,
    projectId: number | null,
    callerId: number,
    callerRole: UserRole,
    dto: CreateShareLinkDto,
  ): Promise<NoteShareLink> {
    await this.assertNoteOwnerOrAdmin(noteId, projectId, callerId, callerRole);

    const token = randomBytes(32).toString('hex');
    const expiresAt = dto.expiresInDays
      ? new Date(Date.now() + dto.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const link = this.shareLinkRepo.create({
      noteId,
      token,
      accessLevel: dto.accessLevel ?? AccessLevel.VIEW,
      email: dto.email ?? null,
      expiresAt,
      createdByUserId: callerId,
    });

    const saved = await this.shareLinkRepo.save(link);

    if (dto.email) {
      const note = await this.repo.findOneBy({ id: noteId });
      const frontendUrl = this.config.get<string>('FRONTEND_URL');
      const shareUrl = `${frontendUrl}/shared/${token}`;
      await this.mailService.sendNoteShareEmail(
        dto.email,
        note?.title ?? 'Notatka',
        shareUrl,
      );

      // jeśli e-mail odpowiada istniejącemu kontu — dodatkowo zaproszenie w aplikacji
      const [invitedUser] = await this.usersService.find(dto.email);
      if (invitedUser) {
        this.eventEmitter.emit(
          NOTE_INVITE_EVENT,
          new NoteInviteEvent(
            noteId,
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
    noteId: number,
    projectId: number | null,
    callerId: number,
    callerRole: UserRole,
  ): Promise<NoteShareLink[]> {
    await this.assertNoteOwnerOrAdmin(noteId, projectId, callerId, callerRole);
    return this.shareLinkRepo.find({
      where: { noteId, revoked: false },
      order: { createdAt: 'DESC' },
    });
  }

  async revokeShareLink(
    noteId: number,
    projectId: number | null,
    linkId: number,
    callerId: number,
    callerRole: UserRole,
  ): Promise<void> {
    await this.assertNoteOwnerOrAdmin(noteId, projectId, callerId, callerRole);
    await this.shareLinkRepo.update({ id: linkId, noteId }, { revoked: true });
  }

  // ── publiczny dostęp przez token (bez konta) ────────────────────────────

  private async resolveShareLink(token: string): Promise<NoteShareLink> {
    const link = await this.shareLinkRepo.findOneBy({ token });
    if (!link || link.revoked) {
      throw new ForbiddenException('Link jest nieprawidłowy lub odwołany');
    }
    if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
      throw new ForbiddenException('Link wygasł');
    }
    return link;
  }

  async getSharedNote(
    token: string,
  ): Promise<{ note: Note; accessLevel: AccessLevel }> {
    const link = await this.resolveShareLink(token);
    const note = await this.repo.findOne({
      where: { id: link.noteId },
      relations: ['owner'],
    });
    if (!note) throw new NotFoundException('Note not found');
    return { note, accessLevel: link.accessLevel };
  }

  async updateSharedNote(token: string, dto: UpdateNoteDto): Promise<Note> {
    const link = await this.resolveShareLink(token);
    if (!hasAccess(link.accessLevel, AccessLevel.EDIT)) {
      throw new ForbiddenException('Ten link daje tylko dostep do odczytu');
    }
    const note = await this.repo.findOneBy({ id: link.noteId });
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    if (dto.keywords) dto.keywords = dto.keywords.map((k) => k.toUpperCase());
    assignDefined(note, dto);
    return this.repo.save(note);
  }

  async claimShareLink(token: string, userId: number): Promise<NoteMember> {
    const link = await this.resolveShareLink(token);
    const existing = await this.memberRepo.findOneBy({
      noteId: link.noteId,
      userId,
    });

    let saved: NoteMember;
    if (existing) {
      existing.accessLevel = link.accessLevel;
      saved = await this.memberRepo.save(existing);
    } else {
      const member = this.memberRepo.create({
        noteId: link.noteId,
        userId,
        accessLevel: link.accessLevel,
      });
      saved = await this.memberRepo.save(member);
    }

    const note = await this.repo.findOneBy({ id: link.noteId });
    if (note) {
      this.eventEmitter.emit(
        SHARE_LINK_CLAIMED_EVENT,
        new ShareLinkClaimedEvent(link.noteId, note.ownerId, userId, link.id),
      );
    }

    return saved;
  }
}
