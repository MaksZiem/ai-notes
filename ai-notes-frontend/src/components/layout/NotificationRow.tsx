import { Check, X, Loader2 } from "lucide-react";
import type { Notification } from "../../types/notification";
import { notificationMessage } from "../../utils/notificationMessage";
import { formatDate } from "../../utils/formatDate";

export function NotificationRow({
  notification: n,
  onOpen,
  onAccept,
  onDecline,
  acceptPending,
  declinePending,
  compact = false,
}: {
  notification: Notification;
  onOpen: (n: Notification) => void;
  onAccept: (id: number) => void;
  onDecline: (id: number) => void;
  acceptPending?: boolean;
  declinePending?: boolean;
  compact?: boolean;
}) {
  const isPendingInvite =
    (n.type === "NOTE_INVITE" || n.type === "PROJECT_INVITE") && n.status === "PENDING";

  return (
    <div
      onClick={() => !isPendingInvite && onOpen(n)}
      className={`flex items-start gap-2.5 rounded-lg transition-colors duration-100 ${
        compact ? "pl-7 pr-2.5 py-2" : "px-4 py-3 border"
      } ${!n.isRead ? "bg-indigo-500/[0.06]" : ""} ${
        !compact
          ? n.isRead
            ? "border-white/[0.06] hover:border-white/[0.12]"
            : "border-indigo-500/25 hover:border-indigo-500/40"
          : ""
      } ${!isPendingInvite ? "cursor-pointer hover:bg-white/5" : ""}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
          !n.isRead ? "bg-indigo-400" : "border border-gray-600"
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className={`${compact ? "text-[12px]" : "text-[13px]"} text-gray-200 leading-snug m-0`}>
          {notificationMessage(n)}
        </p>
        <p className={`${compact ? "text-[10.5px]" : "text-[11px]"} text-gray-600 mt-0.5 m-0`}>
          {formatDate(n.createdAt)}
          {(n.type === "NOTE_INVITE" || n.type === "PROJECT_INVITE") &&
            n.status === "ACCEPTED" &&
            " · zaakceptowano"}
          {(n.type === "NOTE_INVITE" || n.type === "PROJECT_INVITE") &&
            n.status === "DECLINED" &&
            " · odrzucono"}
        </p>

        {isPendingInvite && (
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAccept(n.id);
              }}
              disabled={acceptPending || declinePending}
              className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors"
            >
              {acceptPending ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
              Akceptuj
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDecline(n.id);
              }}
              disabled={acceptPending || declinePending}
              className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-50 text-gray-300 transition-colors"
            >
              {declinePending ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />}
              Odrzuć
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
