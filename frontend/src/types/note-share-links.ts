export type AccessLevel = 'VIEW' | 'EDIT' | 'DELETE'

export interface NoteShareLink {
  id: string;
  token: string;
  noteId: string;
  accessLevel: AccessLevel;
  email: string | null;
  expiresAt: string | null;
  revoked: boolean;
  createdAt: string;
}