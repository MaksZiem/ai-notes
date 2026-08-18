import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';
import { NotificationType } from 'src/enums/notification-type.enum';
import {
  NOTE_ACCESS_REVOKED_EVENT,
  NOTE_SHARED_EVENT,
  NoteAccessRevokedEvent,
  NoteSharedEvent,
  SHARE_LINK_CLAIMED_EVENT,
  ShareLinkClaimedEvent,
} from './notifications.events';

@Injectable()
export class NotificationsListener {
  constructor(private notificationsService: NotificationsService) {}

  @OnEvent(NOTE_SHARED_EVENT)
  async handleNoteShared(event: NoteSharedEvent) {
    if (event.recipientUserId === event.actorId) return;
    await this.notificationsService.create({
      userId: event.recipientUserId,
      type: NotificationType.NOTE_SHARED,
      actorId: event.actorId,
      noteId: event.noteId,
      accessLevel: event.accessLevel,
    });
  }

  @OnEvent(NOTE_ACCESS_REVOKED_EVENT)
  async handleNoteAccessRevoked(event: NoteAccessRevokedEvent) {
    if (event.recipientUserId === event.actorId) return;
    await this.notificationsService.create({
      userId: event.recipientUserId,
      type: NotificationType.NOTE_ACCESS_REVOKED,
      actorId: event.actorId,
      noteId: event.noteId,
    });
  }

  @OnEvent(SHARE_LINK_CLAIMED_EVENT)
  async handleShareLinkClaimed(event: ShareLinkClaimedEvent) {
    if (event.ownerId === event.claimerId) return;
    await this.notificationsService.create({
      userId: event.ownerId,
      type: NotificationType.SHARE_LINK_CLAIMED,
      actorId: event.claimerId,
      noteId: event.noteId,
    });
  }
}
