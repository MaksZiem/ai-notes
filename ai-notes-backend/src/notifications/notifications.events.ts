import { AccessLevel } from 'src/enums/access-level.enum';

export const NOTE_SHARED_EVENT = 'note.shared';
export const NOTE_ACCESS_REVOKED_EVENT = 'note.access-revoked';
export const SHARE_LINK_CLAIMED_EVENT = 'note.share-link-claimed';
export const NOTE_INVITE_EVENT = 'note.invite';

export class NoteSharedEvent {
  constructor(
    public readonly noteId: number,
    public readonly recipientUserId: number,
    public readonly actorId: number,
    public readonly accessLevel: AccessLevel,
  ) {}
}

export class NoteAccessRevokedEvent {
  constructor(
    public readonly noteId: number,
    public readonly recipientUserId: number,
    public readonly actorId: number,
  ) {}
}

export class ShareLinkClaimedEvent {
  constructor(
    public readonly noteId: number,
    public readonly ownerId: number,
    public readonly claimerId: number,
    public readonly shareLinkId: number,
  ) {}
}

export class NoteInviteEvent {
  constructor(
    public readonly noteId: number,
    public readonly shareLinkId: number,
    public readonly recipientUserId: number,
    public readonly actorId: number,
    public readonly accessLevel: AccessLevel,
  ) {}
}