export type AccessLevel = "VIEW" | "EDIT" | "DELETE";

export interface ProjectShareLink {
  id: number;
  token: string;
  projectId: number;
  accessLevel: AccessLevel;
  email: string | null;
  expiresAt: string | null;
  revoked: boolean;
  createdAt: string;
}

export interface ProjectInvite {
  project: { id: number; name: string; description?: string };
  invitedBy: { name: string; surname: string } | null;
  accessLevel: AccessLevel;
}
