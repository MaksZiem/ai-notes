import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';
import { NotificationType } from 'src/enums/notification-type.enum';
import { NotificationStatus } from 'src/enums/notification-status.enum';
import {
  NOTE_ACCESS_REVOKED_EVENT,
  NOTE_INVITE_EVENT,
  NOTE_SHARED_EVENT,
  NoteAccessRevokedEvent,
  NoteInviteEvent,
  NoteSharedEvent,
  SHARE_LINK_CLAIMED_EVENT,
  ShareLinkClaimedEvent,
  PROJECT_SHARED_EVENT,
  PROJECT_ACCESS_REVOKED_EVENT,
  PROJECT_SHARE_LINK_CLAIMED_EVENT,
  PROJECT_INVITE_EVENT,
  ProjectSharedEvent,
  ProjectAccessRevokedEvent,
  ProjectShareLinkClaimedEvent,
  ProjectInviteEvent,
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
    // niezależnie od tego, którędy dostęp powstał — zsynchronizuj ew. oczekujące zaproszenie
    await this.notificationsService.markInviteAccepted(event.shareLinkId, event.claimerId);

    if (event.ownerId === event.claimerId) return;
    await this.notificationsService.create({
      userId: event.ownerId,
      type: NotificationType.SHARE_LINK_CLAIMED,
      actorId: event.claimerId,
      noteId: event.noteId,
    });
  }

  @OnEvent(NOTE_INVITE_EVENT)
  async handleNoteInvite(event: NoteInviteEvent) {
    if (event.recipientUserId === event.actorId) return;
    await this.notificationsService.create({
      userId: event.recipientUserId,
      type: NotificationType.NOTE_INVITE,
      actorId: event.actorId,
      noteId: event.noteId,
      shareLinkId: event.shareLinkId,
      accessLevel: event.accessLevel,
      status: NotificationStatus.PENDING,
    });
  }

  @OnEvent(PROJECT_SHARED_EVENT)
  async handleProjectShared(event: ProjectSharedEvent) {
    if (event.recipientUserId === event.actorId) return;
    await this.notificationsService.create({
      userId: event.recipientUserId,
      type: NotificationType.PROJECT_SHARED,
      actorId: event.actorId,
      projectId: event.projectId,
      accessLevel: event.accessLevel,
    });
  }

  @OnEvent(PROJECT_ACCESS_REVOKED_EVENT)
  async handleProjectAccessRevoked(event: ProjectAccessRevokedEvent) {
    if (event.recipientUserId === event.actorId) return;
    await this.notificationsService.create({
      userId: event.recipientUserId,
      type: NotificationType.PROJECT_ACCESS_REVOKED,
      actorId: event.actorId,
      projectId: event.projectId,
    });
  }

  @OnEvent(PROJECT_SHARE_LINK_CLAIMED_EVENT)
  async handleProjectShareLinkClaimed(event: ProjectShareLinkClaimedEvent) {
    await this.notificationsService.markProjectInviteAccepted(event.shareLinkId, event.claimerId);

    if (event.ownerId === event.claimerId) return;
    await this.notificationsService.create({
      userId: event.ownerId,
      type: NotificationType.PROJECT_SHARE_LINK_CLAIMED,
      actorId: event.claimerId,
      projectId: event.projectId,
    });
  }

  @OnEvent(PROJECT_INVITE_EVENT)
  async handleProjectInvite(event: ProjectInviteEvent) {
    if (event.recipientUserId === event.actorId) return;
    await this.notificationsService.create({
      userId: event.recipientUserId,
      type: NotificationType.PROJECT_INVITE,
      actorId: event.actorId,
      projectId: event.projectId,
      projectShareLinkId: event.shareLinkId,
      accessLevel: event.accessLevel,
      status: NotificationStatus.PENDING,
    });
  }
}
