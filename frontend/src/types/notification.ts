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
  id: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  accessLevel: "VIEW" | "EDIT" | "DELETE" | null;
  status: NotificationStatus | null;
  actor: { id: string; name: string; surname: string } | null;
  note: { id: string; title: string } | null;
  project: { id: string; name: string } | null;
}
