import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/SideBar/SideBar";
import { useNotifications } from "../hooks/useNotifications";
import { notificationMessage } from "../utils/notificationMessage";
import { formatDate } from "../utils/formatDate";
import type { Notification } from "../types/notification";

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-600 bg-[#1a1b23] border border-white/[0.06] rounded-2xl">
      <Bell size={28} className="opacity-30" />
      <p className="text-sm mt-2">Brak powiadomień</p>
    </div>
  );
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleClick = (n: Notification) => {
    if (!n.isRead) markAsRead.mutate(n.id);
    if (n.note) navigate(`/notes/${n.note.id}`);
  };

  return (
    <div className="flex h-screen bg-[#0f1014]">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/[0.06]">
          <div>
            <h1 className="text-2xl font-bold text-gray-100 tracking-tight leading-none m-0">
              Powiadomienia
            </h1>
            <p className="text-xs text-gray-600 mt-1 m-0">
              {unreadCount.data?.count ? `${unreadCount.data.count} nieprzeczytanych` : "Wszystko przeczytane"}
            </p>
          </div>

          {!!unreadCount.data?.count && (
            <button
              onClick={() => markAllAsRead.mutate()}
              className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-gray-300 text-sm font-medium rounded-lg transition-colors duration-150"
            >
              Oznacz wszystkie jako przeczytane
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {notifications.isLoading ? (
            <p className="text-xs text-gray-600">Ładowanie...</p>
          ) : !notifications.data?.length ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col gap-2 max-w-2xl">
              {notifications.data.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full flex items-start gap-3 text-left px-4 py-3 rounded-xl border transition-all duration-150 ${
                    n.isRead
                      ? "bg-[#1a1b23] border-white/[0.06] hover:border-white/[0.12]"
                      : "bg-indigo-500/[0.06] border-indigo-500/25 hover:border-indigo-500/40"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                      n.isRead ? "border border-gray-600" : "bg-indigo-400"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-gray-200 leading-snug m-0">{notificationMessage(n)}</p>
                    <p className="text-[11px] text-gray-600 mt-1 m-0">{formatDate(n.createdAt)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
