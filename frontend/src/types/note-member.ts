import type { AccessLevel } from "./note-share-links";
import type { UserRole } from "./user";

export interface NoteMemberUser {
  id: string;
  email: string;
  name: string;
  surname: string;
  role: UserRole;
}

export interface NoteMember {
  id: string;
  noteId: string;
  userId: string;
  accessLevel: AccessLevel;
  user: NoteMemberUser;
}
