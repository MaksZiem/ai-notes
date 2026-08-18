import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/SideBar/SideBar";
import { NotificationRow } from "../components/layout/NotificationRow";
import { useNotifications } from "../hooks/useNotifications";
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
  const { notifications, unreadCount, markAsRead, markAllAsRead, acceptInvite, declineInvite } =
    useNotifications();

  const handleOpen = (n: Notification) => {
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
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onOpen={handleOpen}
                  onAccept={(id) => acceptInvite.mutate(id)}
                  onDecline={(id) => declineInvite.mutate(id)}
                  acceptPending={acceptInvite.isPending && acceptInvite.variables === n.id}
                  declinePending={declineInvite.isPending && declineInvite.variables === n.id}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
