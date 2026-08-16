import { useNavigate } from "react-router-dom";
import { FileText, Folder, Plus, ArrowRight, Clock } from "lucide-react";
import Sidebar from "../components/layout/SideBar/SideBar";
import { useNotes } from "../hooks/useNotes";
import { useProjects } from "../hooks/useProjects";
import { NoteCard } from "../components/layout/NoteCard";
import { formatDate } from "../utils/formatDate";
import type { Project } from "../types/project";

const PROJECT_DEFAULT_COLOR = "#6366f1";

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-4 bg-[#1a1b23] border border-white/[0.06] rounded-2xl px-5 py-4 flex-1">
      <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-100 leading-none m-0">{value}</p>
        <p className="text-xs text-gray-500 mt-1 m-0">{label}</p>
      </div>
    </div>
  );
}

function RecentProjectRow({ project, onClick }: { project: Project; onClick: () => void }) {
  const color = project.color ?? PROJECT_DEFAULT_COLOR;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a1b23] border border-white/[0.06] rounded-xl hover:border-indigo-500/30 hover:bg-[#1e1f29] transition-all duration-200 text-left"
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: color + "22" }}
      >
        <Folder size={15} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-gray-100 truncate m-0">{project.name}</p>
        <p className="text-[11.5px] text-gray-500 truncate m-0">{project.description || "Brak opisu"}</p>
      </div>
      <span className="flex items-center gap-1 text-[11px] text-gray-600 flex-shrink-0">
        <Clock size={11} />
        {formatDate(project.updatedAt)}
      </span>
    </button>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-600 bg-[#1a1b23] border border-white/[0.06] rounded-2xl">
      {icon}
      <p className="text-sm mt-2">{text}</p>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const { notes: allNotes } = useNotes();
  const { notes: recentNotes } = useNotes({ limit: 5 });
  const { projects: allProjects, recentProjects } = useProjects();

  const notesCount = allNotes.data?.length ?? 0;
  const projectsCount = allProjects.data?.length ?? 0;

  return (
    <div className="flex h-screen bg-[#0f1014]">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/[0.06]">
          <div>
            <h1 className="text-2xl font-bold text-gray-100 tracking-tight leading-none m-0">
              Strona główna
            </h1>
            <p className="text-xs text-gray-600 mt-1 m-0">Twój przegląd notatek i projektów</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/projects")}
              className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-gray-300 text-sm font-medium rounded-lg transition-colors duration-150"
            >
              <Plus size={15} />
              Nowy projekt
            </button>
            <button
              onClick={() => navigate("/notes/new")}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors duration-150"
            >
              <Plus size={15} />
              Nowa notatka
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="flex items-center gap-4 mb-8">
            <StatCard icon={<FileText size={18} />} label="Notatek łącznie" value={notesCount} />
            <StatCard icon={<Folder size={18} />} label="Projektów łącznie" value={projectsCount} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 m-0">
                  Ostatnio aktualizowane projekty
                </h2>
                <button
                  onClick={() => navigate("/projects")}
                  className="flex items-center gap-1 text-[11.5px] text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Zobacz wszystkie <ArrowRight size={12} />
                </button>
              </div>

              {recentProjects.isLoading ? (
                <p className="text-xs text-gray-600">Ładowanie...</p>
              ) : (recentProjects.data ?? []).length === 0 ? (
                <EmptyState icon={<Folder size={28} className="opacity-30" />} text="Brak projektów. Utwórz pierwszy!" />
              ) : (
                <div className="flex flex-col gap-2">
                  {(recentProjects.data ?? []).map((p) => (
                    <RecentProjectRow key={p.id} project={p} onClick={() => navigate(`/notes?projectId=${p.id}`)} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 m-0">
                  Ostatnio aktualizowane notatki
                </h2>
                <button
                  onClick={() => navigate("/notes")}
                  className="flex items-center gap-1 text-[11.5px] text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Zobacz wszystkie <ArrowRight size={12} />
                </button>
              </div>

              {recentNotes.isLoading ? (
                <p className="text-xs text-gray-600">Ładowanie...</p>
              ) : (recentNotes.data ?? []).length === 0 ? (
                <EmptyState icon={<FileText size={28} className="opacity-30" />} text="Brak notatek. Utwórz pierwszą!" />
              ) : (
                <div className="flex flex-col gap-2">
                  {(recentNotes.data ?? []).map((n) => (
                    <NoteCard key={n.id} note={n} onClick={() => navigate(`/notes/${n.id}`)} list />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
