export type NotificationType =
  | "NOTE_SHARED"
  | "NOTE_ACCESS_REVOKED"
  | "SHARE_LINK_CLAIMED";

export interface Notification {
  id: number;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  accessLevel: "VIEW" | "EDIT" | "DELETE" | null;
  actor: { id: number; name: string; surname: string } | null;
  note: { id: number; title: string } | null;
}
