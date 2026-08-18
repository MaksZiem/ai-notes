import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationType } from 'src/enums/notification-type.enum';
import { AccessLevel } from 'src/enums/access-level.enum';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private repo: Repository<Notification>,
  ) {}

  async create(data: {
    userId: number;
    type: NotificationType;
    actorId?: number | null;
    noteId?: number | null;
    accessLevel?: AccessLevel | null;
  }): Promise<Notification> {
    const notification = this.repo.create(data);
    return this.repo.save(notification);
  }

  async findAllForUser(userId: number): Promise<Notification[]> {
    return this.repo.find({
      where: { userId },
      relations: ['actor', 'note'],
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
}
