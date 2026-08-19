export type NotificationType =
  | "NOTE_SHARED"
  | "NOTE_ACCESS_REVOKED"
  | "SHARE_LINK_CLAIMED"
  | "NOTE_INVITE"
  | "PROJECT_SHARED"
  | "PROJECT_ACCESS_REVOKED"
  | "PROJECT_SHARE_LINK_CLAIMED"
  | "PROJECT_INVITE";

export type NotificationStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export interface Notification {
  id: number;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  accessLevel: "VIEW" | "EDIT" | "DELETE" | null;
  status: NotificationStatus | null;
  actor: { id: number; name: string; surname: string } | null;
  note: { id: number; title: string } | null;
  project: { id: number; name: string } | null;
}
