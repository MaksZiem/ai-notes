import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationType } from 'src/enums/notification-type.enum';
import { NotificationStatus } from 'src/enums/notification-status.enum';
import { AccessLevel } from 'src/enums/access-level.enum';
import { NotesService } from 'src/notes/notes.service';
import { ProjectsService } from 'src/projects/projects.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private repo: Repository<Notification>,
    private notesService: NotesService,
    private projectsService: ProjectsService,
  ) {}

  async create(data: {
    userId: number;
    type: NotificationType;
    actorId?: number | null;
    noteId?: number | null;
    projectId?: number | null;
    accessLevel?: AccessLevel | null;
    shareLinkId?: number | null;
    projectShareLinkId?: number | null;
    status?: NotificationStatus | null;
  }): Promise<Notification> {
    const notification = this.repo.create(data);
    return this.repo.save(notification);
  }

  async findAllForUser(userId: number): Promise<Notification[]> {
    return this.repo.find({
      where: { userId },
      relations: ['actor', 'note', 'project'],
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async unreadCount(userId: number): Promise<number> {
    return this.repo.count({ where: { userId, isRead: false } });
  }

  async markAsRead(id: number, userId: number): Promise<Notification> {
    const notification = await this.repo.findOneBy({ id, userId });
    if (!notification) throw new NotFoundException('Notification not found');
    notification.isRead = true;
    return this.repo.save(notification)
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.repo.update({userId, isRead: false}, {isRead: true})
  }

  async accept(id: number, userId: number): Promise<Notification> {
    const notification = await this.repo.findOne({
      where: { id, userId },
      relations: ['shareLink', 'projectShareLink'],
    });
    if (!notification) {
      throw new NotFoundException('Zaproszenie nie zostało znalezione');
    }
    if (notification.status !== NotificationStatus.PENDING) {
      throw new ForbiddenException('To zaproszenie zostało już rozpatrzone');
    }

    if (notification.type === NotificationType.NOTE_INVITE) {
      if (!notification.shareLink) {
        throw new NotFoundException('Link udostępniania powiązany z zaproszeniem już nie istnieje');
      }
      await this.notesService.claimShareLink(notification.shareLink.token, userId);
    } else if (notification.type === NotificationType.PROJECT_INVITE) {
      if (!notification.projectShareLink) {
        throw new NotFoundException('Link udostępniania powiązany z zaproszeniem już nie istnieje');
      }
      await this.projectsService.claimShareLink(notification.projectShareLink.token, userId);
    } else {
      throw new NotFoundException('Zaproszenie nie zostało znalezione');
    }

    notification.status = NotificationStatus.ACCEPTED;
    notification.isRead = true;
    return this.repo.save(notification);
  }

  async decline(id: number, userId: number): Promise<Notification> {
    const notification = await this.repo.findOneBy({ id, userId });
    if (
      !notification ||
      (notification.type !== NotificationType.NOTE_INVITE &&
        notification.type !== NotificationType.PROJECT_INVITE)
    ) {
      throw new NotFoundException('Zaproszenie nie zostało znalezione');
    }
    if (notification.status !== NotificationStatus.PENDING) {
      throw new ForbiddenException('To zaproszenie zostało już rozpatrzone');
    }

    if (notification.type === NotificationType.PROJECT_INVITE && notification.projectShareLinkId) {
      // odrzucenie zaproszenia unieważnia też sam link — nie da się go później zaakceptować
      await this.projectsService.revokeShareLinkById(notification.projectShareLinkId);
    }

    notification.status = NotificationStatus.DECLINED;
    notification.isRead = true;
    return this.repo.save(notification);
  }

  /**
   * Synchronizuje zaproszenie do notatki, gdy dostęp zostaje przyznany inną drogą niż
   * przycisk "Akceptuj" (np. "Dodaj do moich notatek" na /shared/:token).
   * No-op, jeśli nie ma pasującego oczekującego zaproszenia.
   */
  async markInviteAccepted(shareLinkId: number, userId: number): Promise<void> {
    await this.repo.update(
      {
        shareLinkId,
        userId,
        type: NotificationType.NOTE_INVITE,
        status: NotificationStatus.PENDING,
      },
      { status: NotificationStatus.ACCEPTED, isRead: true },
    );
  }

  /**
   * To samo co markInviteAccepted, ale dla zaproszeń do projektów.
   */
  async markProjectInviteAccepted(projectShareLinkId: number, userId: number): Promise<void> {
    await this.repo.update(
      {
        projectShareLinkId,
        userId,
        type: NotificationType.PROJECT_INVITE,
        status: NotificationStatus.PENDING,
      },
      { status: NotificationStatus.ACCEPTED, isRead: true },
    );
  }
}
