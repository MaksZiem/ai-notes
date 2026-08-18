import type { AccessLevel } from "./note-share-links";
import type { UserRole } from "./user";

export interface NoteMemberUser {
  id: number;
  email: string;
  name: string;
  surname: string;
  role: UserRole;
}

export interface NoteMember {
  id: number;
  noteId: number;
  userId: number;
  accessLevel: AccessLevel;
  user: NoteMemberUser;
}
