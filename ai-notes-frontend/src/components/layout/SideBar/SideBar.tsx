import { useNavigate } from "react-router-dom";
import {
  Home,
  Folder,
  FileText,
  Bell,
  Settings,
  Search,
  Star,
} from "lucide-react";
import { useNotes } from "../../../hooks/useNotes";
import { useProjects } from "../../../hooks/useProjects";
import Section from "./Section";
import NavItem from "./NavItem";
import Projects from "./Projects";
import SideBarFooter from "./SideBarFooter";

// ─── Mock data ───────────────────────────────────────────────
const NOTIFICATIONS = [
  { id: 1, text: "Anna nadała Ci dostęp do projektu", time: "5 min", unread: true },
  { id: 2, text: "Nowa notatka w API v2 – migracja", time: "1 godz.", unread: true },
  { id: 3, text: "Projekt Redesign zaktualizowany", time: "3 godz.", unread: false },
];


// ─── Main Sidebar ─────────────────────────────────────────────
export default function Sidebar() {
  const navigate = useNavigate();
  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length;
  const { notes: { data: recentNotes = [], isLoading: notesLoading } } = useNotes({ limit: 5 });
  const { recentProjects: { data: recentProjects = [], isLoading: projectsLoading } } = useProjects();

  return (
    <aside className="w-60 min-w-60 h-screen bg-[#13141a] border-r border-white/[0.07] flex flex-col overflow-hidden sticky top-0">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-[18px] border-b border-white/[0.07] mb-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-extrabold tracking-tight flex-shrink-0">
          N
        </div>
        <span className="text-sm font-bold text-gray-100 tracking-tight">NoteSpace</span>
      </div>

      {/* Search */}
      <div className="mx-2.5 mb-3 flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] hover:border-indigo-500/40 rounded-lg px-3 py-1.5 text-gray-500 text-xs cursor-text transition-colors duration-150">
        <Search size={13} />
        <span className="flex-1">Szukaj...</span>
        <span className="text-[10px] bg-white/[0.07] px-1.5 py-px rounded opacity-60">⌘K</span>
      </div>

      {/* Scrollable nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2">

        {/* Main links */}
        <div className="flex flex-col gap-0.5 mb-2">
          <NavItem label="Strona główna"  path="/"               icon={<Home size={15} />}      onClick={() => navigate("/")} />
          <NavItem label="Notatki"        path="/notes"         icon={<FileText size={15} />}  onClick={() => navigate("/notes")} />
          <NavItem label="Projekty"       path="/projects"      icon={<Folder size={15} />}    onClick={() => navigate("/projects")} />
          <NavItem label="Powiadomienia"  path="/notifications" icon={<Bell size={15} />}       badge={unreadCount} onClick={() => navigate("/notifications")} />
          <NavItem label="Ustawienia"     path="/settings"      icon={<Settings size={15} />}   onClick={() => navigate("/settings")} />
        </div>

        <hr className="border-white/[0.07] my-2" />

        {/* Projects */}
        <Projects projects={recentProjects} loading={projectsLoading} />


        <hr className="border-white/[0.07] my-2" />

        {/* Recent notes */}
        <Section label="Ostatnie notatki" icon={<FileText size={13} />} defaultOpen>
          {notesLoading ? (
            <p className="pl-7 py-2 text-xs text-gray-600">Ładowanie...</p>
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
                    {n.project?.name ?? "Notatka prywatna"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Section>

        <hr className="border-white/[0.07] my-2" />

        {/* Notifications preview */}
        <Section label="Powiadomienia" icon={<Bell size={13} />} badge={unreadCount} defaultOpen={false}>
          <div className="flex flex-col gap-px mt-0.5">
            {NOTIFICATIONS.map((n) => (
              <div
                key={n.id}
                className="flex items-start gap-2.5 pl-7 pr-2.5 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors duration-100"
              >
                <span className={`w-1.5 h-1.5 rounded-full mt-[5px] flex-shrink-0 ${n.unread ? "bg-indigo-400" : "border border-gray-600"}`} />
                <div>
                  <p className="text-[12px] text-gray-300 leading-snug">{n.text}</p>
                  <p className="text-[10.5px] text-gray-600 mt-0.5">{n.time} temu</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <hr className="border-white/[0.07] my-2" />

        {/* Starred */}
        <Section label="Ulubione" icon={<Star size={13} />} defaultOpen={false}>
          <p className="pl-7 py-2 text-xs text-gray-600 italic">Brak ulubionych elementów</p>
        </Section>
      </nav>

      {/* Bottom: user + logout */}
        <SideBarFooter />
    </aside>
  );
}