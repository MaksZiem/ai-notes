import { useNavigate } from "react-router-dom";
import { useTranslations } from "use-intl";
import LocaleSwitcher from "../LocaleSwitcher";
import {
  Home,
  Folder,
  FileText,
  Bell,
  Settings,
  Search,
  Star,
  MessageCircle,
} from "lucide-react";
import { useNotes } from "../../../hooks/useNotes";
import { useProjects } from "../../../hooks/useProjects";
import { useNotifications } from "../../../hooks/useNotifications";
import { NotificationRow } from "../NotificationRow";
import Section from "./Section";
import NavItem from "./NavItem";
import Projects from "./Projects";
import SideBarFooter from "./SideBarFooter";
import type { Notification } from "../../../types/notification";

export default function Sidebar() {
  const navigate = useNavigate();
  const t = useTranslations();
  const { notes: { data: recentNotes = [], isLoading: notesLoading } } = useNotes({ limit: 5 });
  const { recentProjects: { data: recentProjects = [], isLoading: projectsLoading } } = useProjects();
  const { notifications, unreadCount, markAsRead, acceptInvite, declineInvite } = useNotifications();
  const recentNotifications = (notifications.data ?? []).slice(0, 5);

  const handleOpenNotification = (n: Notification) => {
    if (!n.isRead) markAsRead.mutate(n.id);
    if (n.note) navigate(`/notes/${n.note.id}`);
  };

  return (
    <aside className="w-60 min-w-60 h-screen bg-[#13141a] border-r border-white/[0.07] flex flex-col overflow-hidden sticky top-0">

      <div className="flex items-center gap-2.5 px-4 py-[18px] border-b border-white/[0.07] mb-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-extrabold tracking-tight flex-shrink-0">
          N
        </div>
        <span className="text-sm font-bold text-gray-100 tracking-tight">{t("meta.title")}</span>
        <LocaleSwitcher className="ml-auto" />
      </div>

      <div className="mx-2.5 mb-3 flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] hover:border-indigo-500/40 rounded-lg px-3 py-1.5 text-gray-500 text-xs cursor-text transition-colors duration-150">
        <Search size={13} />
        <span className="flex-1">{t("nav.search")}</span>
        <span className="text-[10px] bg-white/[0.07] px-1.5 py-px rounded opacity-60">⌘K</span>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2">

        <div className="flex flex-col gap-0.5 mb-2">
          <NavItem label={t("nav.home")} path="/"               icon={<Home size={15} />}      onClick={() => navigate("/")} />
          <NavItem label={t("nav.notes")} path="/notes"         icon={<FileText size={15} />}  onClick={() => navigate("/notes")} matchPrefix />
          <NavItem label={t("nav.chat")} path="/chat"          icon={<MessageCircle size={15} />} onClick={() => navigate("/chat")} />
          <NavItem label={t("nav.projects")} path="/projects"      icon={<Folder size={15} />}    onClick={() => navigate("/projects")} matchPrefix />
          <NavItem label={t("nav.notifications")} path="/notifications" icon={<Bell size={15} />}       badge={unreadCount.data?.count ?? 0} onClick={() => navigate("/notifications")} />
          <NavItem label={t("nav.settings")} path="/settings"      icon={<Settings size={15} />}   onClick={() => navigate("/settings")} />
        </div>

        <hr className="border-white/[0.07] my-2" />

        <Projects projects={recentProjects} loading={projectsLoading} />

        <hr className="border-white/[0.07] my-2" />

        <Section label={t("nav.recentNotes")} icon={<FileText size={13} />} defaultOpen>
          {notesLoading ? (
            <p className="pl-7 py-2 text-xs text-gray-600">{t("common.loading")}</p>
          ) : (
            <div className="flex flex-col gap-px mt-0.5">
              {recentNotes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => navigate(`/notes/${n.id}`)}
                  className="w-full flex flex-col items-start pl-7 pr-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors duration-100"
                >
                  <span className="text-[12.5px] text-gray-300 font-medium truncate w-full text-left">{n.title}</span>
                  <span className="text-[10.5px] text-gray-600">
                    {n.project?.name ?? t("common.privateNote")}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Section>

        <hr className="border-white/[0.07] my-2" />

        <Section label={t("nav.notifications")} icon={<Bell size={13} />} badge={unreadCount.data?.count ?? 0} defaultOpen={false}>
          <div className="flex flex-col gap-px mt-0.5">
            {notifications.isLoading ? (
              <p className="pl-7 py-2 text-xs text-gray-600">{t("common.loading")}</p>
            ) : recentNotifications.length === 0 ? (
              <p className="pl-7 py-2 text-xs text-gray-600 italic">{t("nav.noNotifications")}</p>
            ) : (
              recentNotifications.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onOpen={handleOpenNotification}
                  onAccept={(id) => acceptInvite.mutate(id)}
                  onDecline={(id) => declineInvite.mutate(id)}
                  acceptPending={acceptInvite.isPending && acceptInvite.variables === n.id}
                  declinePending={declineInvite.isPending && declineInvite.variables === n.id}
                  compact
                />
              ))
            )}
          </div>
        </Section>

        <hr className="border-white/[0.07] my-2" />

        <Section label={t("nav.favourites")} icon={<Star size={13} />} defaultOpen={false}>
          <p className="pl-7 py-2 text-xs text-gray-600 italic">{t("nav.noFavourites")}</p>
        </Section>
      </nav>

        <SideBarFooter />
    </aside>
  );
}