import { useState, type FormEvent, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Plus, LayoutGrid, List, Pin, Folder, Star, Clock, X, Share2, LogOut,
} from "lucide-react";
import Sidebar from "../components/layout/SideBar/SideBar";
import { api } from "../api/client";
import { useProjects } from "../hooks/useProjects";
import type { Project } from "../types/project";
import { NoteViewType } from "../enums/noteView";
import { formatDate } from "../utils/formatDate";
import { ProjectShareDialog } from "../components/projects/ProjectShareDialog";
import { usePermissions } from "../context/PermissionsContext";
import { useCurrentUser } from "../hooks/useCurrentUser";

const PROJECT_DEFAULT_COLOR = "#6366f1";

function useProjectQuickActions(projectId: number) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["projects"] });

  const togglePin = useMutation({
    mutationFn: () => api.patch(`/projects/${projectId}/pin`),
    onSuccess: invalidate,
  });

  const toggleFavourite = useMutation({
    mutationFn: () => api.patch(`/projects/${projectId}/favourite`),
    onSuccess: invalidate,
  });

  const leaveProject = useMutation({
    mutationFn: () => api.delete(`/projects/${projectId}/leave`),
    onSuccess: invalidate,
  });

  return { togglePin, toggleFavourite, leaveProject };
}

function QuickActions({
  projectId, pinned, favourite, canManage, onShare,
}: {
  projectId: number; pinned: boolean; favourite: boolean;
  canManage: boolean; onShare: () => void;
}) {
  const { togglePin, toggleFavourite, leaveProject } = useProjectQuickActions(projectId);

  const handleLeave = (e: MouseEvent) => {
    e.stopPropagation();
    if (
      !window.confirm(
        "Opuścić ten projekt? Zniknie z Twojej listy, ale zostanie u właściciela — w każdej chwili może udostępnić Ci go ponownie.",
      )
    )
      return;
    leaveProject.mutate();
  };

  return (
    <div className="flex items-center gap-0.5 flex-shrink-0">
      {canManage ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onShare(); }}
          title="Udostępnij projekt"
          className="p-1 rounded-md text-gray-600 hover:text-indigo-400 transition-colors"
        >
          <Share2 size={13} />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleLeave}
          disabled={leaveProject.isPending}
          title="Opuść projekt — zniknie z Twojej listy, zostanie u właściciela"
          className="p-1 rounded-md text-gray-600 hover:text-red-400 transition-colors"
        >
          <LogOut size={13} />
        </button>
      )}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); togglePin.mutate(); }}
        disabled={togglePin.isPending}
        title={pinned ? "Odepnij" : "Przypnij"}
        className={`p-1 rounded-md transition-colors ${pinned ? "text-amber-400" : "text-gray-600 hover:text-gray-300"}`}
      >
        <Pin size={13} className={pinned ? "fill-amber-400/30" : ""} />
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); toggleFavourite.mutate(); }}
        disabled={toggleFavourite.isPending}
        title={favourite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
        className={`p-1 rounded-md transition-colors ${favourite ? "text-amber-400" : "text-gray-600 hover:text-gray-300"}`}
      >
        <Star size={13} className={favourite ? "fill-amber-400" : ""} />
      </button>
    </div>
  );
}

// ─── ProjectCard (grid) ───────────────────────────────────────────────────────
function ProjectCard({ project, pinned = false, favourite = false, canManage, onClick, onShare }: {
  project: Project;
  pinned?: boolean;
  favourite?: boolean;
  canManage: boolean;
  onClick: () => void;
  onShare: () => void;
}) {
  const color = project.color ?? PROJECT_DEFAULT_COLOR;

  return (
    <div
      onClick={onClick}
      className="group flex flex-col bg-[#1a1b23] border border-white/[0.06] rounded-2xl p-5 hover:border-indigo-500/30 hover:bg-[#1e1f29] transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: color + "22" }}
          >
            <Folder size={14} style={{ color }} />
          </div>
          <h3 className="text-[14px] font-semibold text-gray-100 leading-snug truncate">
            {project.name}
          </h3>
        </div>
        <QuickActions projectId={project.id} pinned={pinned} favourite={favourite} canManage={canManage} onShare={onShare} />
      </div>

      <p className="text-[12.5px] text-gray-500 leading-relaxed line-clamp-3 flex-1 mb-4">
        {project.description || "Brak opisu"}
      </p>

      <div className="pt-3 mt-auto border-t border-white/[0.04] flex items-center justify-end">
        <span className="flex items-center gap-1 text-[11px] text-gray-600">
          <Clock size={11} />{formatDate(project.updatedAt)}
        </span>
      </div>
    </div>
  );
}

// ─── ProjectRow (list) ────────────────────────────────────────────────────────
function ProjectRow({ project, pinned = false, favourite = false, canManage, onClick, onShare }: {
  project: Project;
  pinned?: boolean;
  favourite?: boolean;
  canManage: boolean;
  onClick: () => void;
  onShare: () => void;
}) {
  const color = project.color ?? PROJECT_DEFAULT_COLOR;

  return (
    <div
      onClick={onClick}
      className="group flex items-start gap-4 px-5 py-4 bg-[#1a1b23] border border-white/[0.06] rounded-xl hover:border-indigo-500/30 hover:bg-[#1e1f29] transition-all duration-200 cursor-pointer"
    >
      <div className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: color }} />

      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: color + "22" }}
      >
        <Folder size={13} style={{ color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13.5px] font-semibold text-gray-100 truncate">{project.name}</span>
        </div>
        <p className="text-[12px] text-gray-500 truncate">{project.description || "Brak opisu"}</p>
      </div>

      <div className="flex items-center gap-1 text-[11px] text-gray-600 flex-shrink-0 self-center">
        <Clock size={11} />{formatDate(project.updatedAt)}
      </div>

      <QuickActions projectId={project.id} pinned={pinned} favourite={favourite} canManage={canManage} onShare={onShare} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<NoteViewType>(NoteViewType.GRID);
  const [showFavourites, setShowFavourites] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const { projects, createProject } = useProjects();
  const { projects: pinnedProjects } = useProjects({ pinned: true });
  const { projects: favouriteProjects } = useProjects({ favourite: true });

  const { isAdmin } = usePermissions();
  const { data: currentUser } = useCurrentUser();
  const [shareProjectId, setShareProjectId] = useState<number | null>(null);

  const canManageProject = (project: Project) =>
    isAdmin || project.ownerId === currentUser?.id;

  const allProjects = projects.data ?? [];
  const pinnedIds = new Set((pinnedProjects.data ?? []).map((p) => p.id));
  const favouriteIds = new Set((favouriteProjects.data ?? []).map((p) => p.id));

  const handleProjectClick = (projectId: number) => {
    navigate(`/projects/${projectId}/notes`);
  };

  const handleCreateProject = (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createProject.mutate(
      { name: newName.trim(), description: newDescription.trim() || undefined },
      {
        onSuccess: () => {
          setNewName("");
          setNewDescription("");
          setIsCreateOpen(false);
        },
      }
    );
  };

  const filtered = allProjects.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      !!p.description?.toLowerCase().includes(search.toLowerCase());
    const matchesFav = !showFavourites || favouriteIds.has(p.id);
    return matchesSearch && matchesFav;
  });

  const pinned = filtered.filter((p) => pinnedIds.has(p.id));
  const rest = filtered.filter((p) => !pinnedIds.has(p.id));
  const hasResults = pinned.length + rest.length > 0;

  const renderGrid = (list: Project[], isPinned = false) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {list.map((p) => (
        <ProjectCard
          key={p.id}
          project={p}
          pinned={isPinned}
          favourite={favouriteIds.has(p.id)}
          canManage={canManageProject(p)}
          onClick={() => handleProjectClick(p.id)}
          onShare={() => setShareProjectId(p.id)}
        />
      ))}
    </div>
  );

  const renderList = (list: Project[], isPinned = false) => (
    <div className="flex flex-col gap-2">
      {list.map((p) => (
        <ProjectRow
          key={p.id}
          project={p}
          pinned={isPinned}
          favourite={favouriteIds.has(p.id)}
          canManage={canManageProject(p)}
          onClick={() => handleProjectClick(p.id)}
          onShare={() => setShareProjectId(p.id)}
        />
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
            <p className="text-xs text-gray-600 mt-1 m-0">{allProjects.length} projektów łącznie</p>
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

            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
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

      {isCreateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setIsCreateOpen(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateProject}
            className="w-full max-w-sm bg-[#1a1b23] border border-white/[0.08] rounded-2xl p-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-gray-100 m-0">Nowy projekt</h2>
              <button type="button" onClick={() => setIsCreateOpen(false)} className="text-gray-500 hover:text-gray-300">
                <X size={16} />
              </button>
            </div>

            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nazwa projektu"
              className="bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500/60 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none"
            />
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Opis (opcjonalnie)"
              rows={3}
              className="bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500/60 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none resize-none"
            />

            {createProject.isError && (
              <p className="text-xs text-red-400">Nie udało się utworzyć projektu</p>
            )}

            <div className="flex justify-end gap-2 mt-1">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-gray-200"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={!newName.trim() || createProject.isPending}
                className="px-4 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white"
              >
                {createProject.isPending ? "Tworzenie..." : "Utwórz"}
              </button>
            </div>
          </form>
        </div>
      )}

      {shareProjectId !== null && (
        <ProjectShareDialog
          projectId={shareProjectId}
          onClose={() => setShareProjectId(null)}
        />
      )}
    </div>
  );
}
