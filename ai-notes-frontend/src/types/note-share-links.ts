export type AccessLevel = 'VIEW' | 'EDIT' | 'DELETE'

export interface NoteShareLink {
  id: number;
  token: string;
  noteId: number;
  accessLevel: AccessLevel;
  email: string | null;
  expiresAt: string | null;
  revoked: boolean;
  createdAt: string;
}