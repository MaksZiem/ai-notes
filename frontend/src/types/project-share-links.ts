export type AccessLevel = "VIEW" | "EDIT" | "DELETE";

export interface ProjectShareLink {
  id: string;
  token: string;
  projectId: string;
  accessLevel: AccessLevel;
  email: string | null;
  expiresAt: string | null;
  revoked: boolean;
  createdAt: string;
}

export interface ProjectInvite {
  project: { id: string; name: string; description?: string };
  invitedBy: { name: string; surname: string } | null;
  accessLevel: AccessLevel;
}
