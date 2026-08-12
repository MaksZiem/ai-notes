import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Plus, LayoutGrid, List, Pin, Folder, Star,
  Clock, Users, FileText, MoreHorizontal, ChevronRight,
} from "lucide-react";
import Sidebar from "../components/layout/SideBar/SideBar";
import { NoteViewType } from "../enums/noteView";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MockNote {
  id: number;
  title: string;
  color?: string;
  isPinned: boolean;
  updatedAt: string;
}

interface MockProject {
  id: number;
  name: string;
  description?: string;
  color: string;
  membersCount: number;
  isPinned: boolean;
  isFavourite: boolean;
  updatedAt: string;
  tags?: string[];
  notes: MockNote[];
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_PROJECTS: MockProject[] = [
  {
    id: 1,
    name: "Redesign strony głównej",
    description: "Przebudowa UI głównej strony produktu — nowe komponenty, responsywność, dark mode.",
    color: "#6366f1",
    membersCount: 4,
    isPinned: true,
    isFavourite: true,
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    tags: ["UI", "Frontend"],
    notes: [
      { id: 101, title: "Wireframe – hero section", color: "#6366f1", isPinned: true, updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
      { id: 102, title: "Paleta kolorów dark mode", color: "#a855f7", isPinned: false, updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
      { id: 103, title: "Komponenty do przebudowy", isPinned: false, updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
      { id: 104, title: "Responsywność – breakpointy", isPinned: false, updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: 2,
    name: "API v2 – migracja",
    description: "Migracja endpointów REST do nowej wersji z zachowaniem wstecznej kompatybilności.",
    color: "#ec4899",
    membersCount: 3,
    isPinned: true,
    isFavourite: false,
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    tags: ["Backend", "API"],
    notes: [
      { id: 201, title: "Schemat wersjonowania URL", color: "#ec4899", isPinned: true, updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
      { id: 202, title: "Breaking changes v1 → v2", isPinned: false, updatedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString() },
      { id: 203, title: "Migracja auth tokenów", isPinned: false, updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: 3,
    name: "Panel administracyjny",
    description: "Dashboard dla adminów — zarządzanie użytkownikami, rolami i uprawnieniami.",
    color: "#f59e0b",
    membersCount: 2,
    isPinned: false,
    isFavourite: true,
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["Admin", "Frontend"],
    notes: [
      { id: 301, title: "Role i uprawnienia – matryca", color: "#f59e0b", isPinned: false, updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 302, title: "Widok zarządzania użytkownikami", isPinned: false, updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: 4,
    name: "Dokumentacja techniczna",
    description: "Pełna dokumentacja architektury systemu, endpointów i schematu bazy danych.",
    color: "#10b981",
    membersCount: 6,
    isPinned: false,
    isFavourite: false,
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["Docs"],
    notes: [
      { id: 401, title: "Architektura systemu – overview", color: "#10b981", isPinned: true, updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 402, title: "Schemat bazy danych", isPinned: false, updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 403, title: "Instrukcja deploymentu", isPinned: false, updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 404, title: "Zmienne środowiskowe", isPinned: false, updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: 5,
    name: "Optymalizacja wydajności",
    description: "Analiza i redukcja czasu ładowania stron, lazy loading, code splitting.",
    color: "#0ea5e9",
    membersCount: 2,
    isPinned: false,
    isFavourite: false,
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["Performance"],
    notes: [
      { id: 501, title: "Lighthouse – wyniki bazowe", color: "#0ea5e9", isPinned: false, updatedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 502, title: "Plan optymalizacji", isPinned: false, updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: 6,
    name: "System powiadomień",
    description: "Powiadomienia real-time przez WebSocket — dla notatek, komentarzy i udostępnień.",
    color: "#a855f7",
    membersCount: 3,
    isPinned: false,
    isFavourite: true,
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["Backend", "WebSocket"],
    notes: [
      { id: 601, title: "Protokół WebSocket – design", color: "#a855f7", isPinned: true, updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 602, title: "Typy zdarzeń", isPinned: false, updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 603, title: "Kolejka powiadomień – Redis", isPinned: false, updatedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString() },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60_000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 60) return `${diffMin} min.`;
  if (diffH < 24) return `${diffH} godz.`;
  if (diffD === 1) return "wczoraj";
  if (diffD < 7) return `${diffD} dni`;
  return date.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

const TAG_PALETTE: Record<string, { bg: string; text: string }> = {
  UI:          { bg: "rgba(99,102,241,0.12)",  text: "#a5b4fc" },
  Frontend:    { bg: "rgba(139,92,246,0.12)",  text: "#c4b5fd" },
  Backend:     { bg: "rgba(20,184,166,0.12)",  text: "#5eead4" },
  API:         { bg: "rgba(14,165,233,0.12)",  text: "#7dd3fc" },
  Admin:       { bg: "rgba(245,158,11,0.12)",  text: "#fcd34d" },
  Docs:        { bg: "rgba(16,185,129,0.12)",  text: "#6ee7b7" },
  Performance: { bg: "rgba(244,63,94,0.12)",   text: "#fda4af" },
  WebSocket:   { bg: "rgba(168,85,247,0.12)",  text: "#d8b4fe" },
};
function tagStyle(tag: string) {
  return TAG_PALETTE[tag] ?? { bg: "rgba(99,102,241,0.12)", text: "#a5b4fc" };
}

// ─── ProjectCard (grid) ───────────────────────────────────────────────────────
function ProjectCard({ project, pinned = false, onClick }: {
  project: MockProject;
  pinned?: boolean;
  onClick: () => void;
}) {
  const previewNotes = project.notes.slice(0, 3);
  const remaining = project.notes.length - previewNotes.length;
  const NOTE_DEFAULT_COLOR = "#6366f1";

  return (
    <div
      onClick={onClick}
      className="group flex flex-col bg-[#1a1b23] border border-white/[0.06] rounded-2xl p-5 hover:border-indigo-500/30 hover:bg-[#1e1f29] transition-all duration-200 cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {pinned && <Pin size={13} className="text-amber-400/80 flex-shrink-0" />}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: project.color + "22" }}
          >
            <Folder size={14} style={{ color: project.color }} />
          </div>
          <h3 className="text-[14px] font-semibold text-gray-100 leading-snug truncate">
            {project.name}
          </h3>
        </div>
        <button
          onClick={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-white/10 text-gray-500 hover:text-gray-300 flex-shrink-0"
        >
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Description */}
      <p className="text-[12.5px] text-gray-500 leading-relaxed line-clamp-2 mb-3">
        {project.description ?? "Brak opisu"}
      </p>

      {/* Tags */}
      {project.tags && project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
              style={{ backgroundColor: tagStyle(tag).bg, color: tagStyle(tag).text }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* ── Note previews ── */}
      {previewNotes.length > 0 && (
        <div className="mt-auto pt-3 border-t border-white/[0.05] flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-700 mb-1">
            Ostatnie notatki
          </span>
          {previewNotes.map((note) => (
            <div
              key={note.id}
              className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-white/[0.04] transition-colors"
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: note.color ?? NOTE_DEFAULT_COLOR }}
              />
              <span className="flex-1 text-[12px] text-gray-400 truncate">
                {note.isPinned && <Pin size={9} className="inline mr-1 text-amber-400/70 -mt-px" />}
                {note.title}
              </span>
              <span className="text-[10.5px] text-gray-700 flex-shrink-0 flex items-center gap-0.5">
                <Clock size={9} />{formatDate(note.updatedAt)}
              </span>
            </div>
          ))}
          {remaining > 0 && (
            <span className="text-[11px] text-gray-700 pl-2 pt-0.5">
              +{remaining} więcej
            </span>
          )}
        </div>
      )}

      {/* Footer meta */}
      <div className="pt-3 mt-2 border-t border-white/[0.04] flex items-center justify-between">
        <div className="flex items-center gap-3 text-[11px] text-gray-600">
          <span className="flex items-center gap-1"><FileText size={11} />{project.notes.length} notatek</span>
          <span className="flex items-center gap-1"><Users size={11} />{project.membersCount}</span>
        </div>
        <span className="flex items-center gap-1 text-[11px] text-gray-600">
          <Clock size={11} />{formatDate(project.updatedAt)} temu
        </span>
      </div>
    </div>
  );
}

// ─── ProjectRow (list) ────────────────────────────────────────────────────────
function ProjectRow({ project, pinned = false, onClick }: {
  project: MockProject;
  pinned?: boolean;
  onClick: () => void;
}) {
  const previewNotes = project.notes.slice(0, 2);
  const NOTE_DEFAULT_COLOR = "#6366f1";

  return (
    <div
      onClick={onClick}
      className="group flex items-start gap-4 px-5 py-4 bg-[#1a1b23] border border-white/[0.06] rounded-xl hover:border-indigo-500/30 hover:bg-[#1e1f29] transition-all duration-200 cursor-pointer"
    >
      {/* Color bar */}
      <div className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: project.color }} />

      {/* Icon */}
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: project.color + "22" }}
      >
        <Folder size={13} style={{ color: project.color }} />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {pinned && <Pin size={12} className="text-amber-400/70 flex-shrink-0" />}
          <span className="text-[13.5px] font-semibold text-gray-100 truncate">{project.name}</span>
          {project.tags?.map((tag) => (
            <span
              key={tag}
              className="hidden group-hover:inline text-[10px] font-medium px-1.5 py-0.5 rounded-md"
              style={{ backgroundColor: tagStyle(tag).bg, color: tagStyle(tag).text }}
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="text-[12px] text-gray-500 truncate mb-2">{project.description ?? "Brak opisu"}</p>

        {/* Note previews in list mode */}
        {previewNotes.length > 0 && (
          <div className="flex items-center gap-3">
            {previewNotes.map((note) => (
              <div key={note.id} className="flex items-center gap-1.5 text-[11.5px] text-gray-600">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: note.color ?? NOTE_DEFAULT_COLOR }}
                />
                <span className="truncate max-w-[140px]">{note.title}</span>
              </div>
            ))}
            {project.notes.length > 2 && (
              <span className="text-[11px] text-gray-700">+{project.notes.length - 2}</span>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-[11px] text-gray-600 flex-shrink-0 self-center">
        <span className="flex items-center gap-1"><FileText size={11} />{project.notes.length}</span>
        <span className="flex items-center gap-1"><Users size={11} />{project.membersCount}</span>
        <span className="flex items-center gap-1"><Clock size={11} />{formatDate(project.updatedAt)}</span>
      </div>

      <ChevronRight size={14} className="text-gray-700 group-hover:text-indigo-500/70 transition-colors flex-shrink-0 self-center" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<NoteViewType>(NoteViewType.GRID);
  const [showFavourites, setShowFavourites] = useState(false);

  const handleProjectClick = (projectId: number) => {
    // W przyszłości: navigate(`/notes?projectId=${projectId}`)
    navigate(`/notes?projectId=${projectId}`);
  };

  const filtered = MOCK_PROJECTS.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchesFav = !showFavourites || p.isFavourite;
    return matchesSearch && matchesFav;
  });

  const pinned = filtered.filter((p) => p.isPinned);
  const rest = filtered.filter((p) => !p.isPinned);
  const hasResults = pinned.length + rest.length > 0;

  const renderGrid = (projects: MockProject[], isPinned = false) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {projects.map((p) => (
        <ProjectCard key={p.id} project={p} pinned={isPinned} onClick={() => handleProjectClick(p.id)} />
      ))}
    </div>
  );

  const renderList = (projects: MockProject[], isPinned = false) => (
    <div className="flex flex-col gap-2">
      {projects.map((p) => (
        <ProjectRow key={p.id} project={p} pinned={isPinned} onClick={() => handleProjectClick(p.id)} />
      ))}
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0f1014]">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/[0.06]">
          <div>
            <h1 className="text-2xl font-bold text-gray-100 tracking-tight leading-none m-0">Projekty</h1>
            <p className="text-xs text-gray-600 mt-1 m-0">{MOCK_PROJECTS.length} projektów łącznie</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] hover:border-indigo-500/40 focus-within:border-indigo-500/60 rounded-lg px-3 py-2 transition-colors w-56">
              <Search size={15} className="text-gray-600" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Szukaj projektów..."
                className="bg-transparent text-sm text-gray-300 placeholder-gray-600 outline-none w-full"
              />
            </div>

            <button
              onClick={() => setShowFavourites((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-150 ${
                showFavourites
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : "bg-white/[0.04] border-white/[0.07] text-gray-500 hover:text-gray-300 hover:border-white/20"
              }`}
            >
              <Star size={14} className={showFavourites ? "fill-amber-400" : ""} />
              <span className="hidden sm:inline">Ulubione</span>
            </button>

            <div className="flex items-center gap-0.5 bg-white/[0.04] border border-white/[0.07] rounded-lg p-1">
              <button
                onClick={() => setView(NoteViewType.GRID)}
                className={`p-1.5 rounded-md transition-colors ${view === NoteViewType.GRID ? "bg-indigo-500/20 text-indigo-400" : "text-gray-600 hover:text-gray-400"}`}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setView(NoteViewType.LIST)}
                className={`p-1.5 rounded-md transition-colors ${view === NoteViewType.LIST ? "bg-indigo-500/20 text-indigo-400" : "text-gray-600 hover:text-gray-400"}`}
              >
                <List size={15} />
              </button>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
              <Plus size={15} />
              Nowy projekt
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {!hasResults ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600">
              <Folder size={40} className="mb-4 opacity-30" />
              <p className="text-lg font-medium">Brak projektów</p>
              <p className="text-sm mt-1">{search ? "Spróbuj innej frazy" : "Utwórz pierwszy projekt"}</p>
            </div>
          ) : (
            <>
              {pinned.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <Pin size={13} className="text-amber-400/70" />
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 m-0">Przypięte</h2>
                  </div>
                  {view === NoteViewType.GRID ? renderGrid(pinned, true) : renderList(pinned, true)}
                </section>
              )}
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3 m-0">Wszystkie projekty</h2>
                {rest.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                    <p className="text-sm">Brak projektów. Utwórz pierwszy!</p>
                  </div>
                ) : view === NoteViewType.GRID ? renderGrid(rest) : renderList(rest)}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}