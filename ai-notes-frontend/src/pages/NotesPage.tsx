import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search, Plus, LayoutGrid, List, Pin, ArrowLeft } from "lucide-react";
import Sidebar from "../components/layout/SideBar/SideBar";
import { useNotes } from "../hooks/useNotes";
import { useProjectNotes } from "../hooks/useProjectNotes";
import { useProject } from "../hooks/useProject";
import { useDebounce } from "../hooks/useDebounce";
import type { Note } from "../types/note";
import { NoteCard } from "../components/layout/NoteCard";
import { NoteViewType } from "../enums/noteView";

function noteMatchesSearch(note: Note, query: string) {
  const q = query.toLowerCase();
  return (
    note.title.toLowerCase().includes(q) ||
    !!note.content?.toLowerCase().includes(q) ||
    (note.keywords ?? []).some((k) => k.toLowerCase().includes(q))
  );
}

export default function NotesPage() {
  const navigate = useNavigate();
  const { id: projectIdParam } = useParams<{ id: string }>();
  const projectId = projectIdParam ? Number(projectIdParam) : undefined;
  const isProjectScoped = projectId !== undefined && !Number.isNaN(projectId);

  const [search, setSearch] = useState("");
  const [view, setView] = useState<NoteViewType>(NoteViewType.GRID);

  const debouncedSearch = useDebounce(search, 300);

  const { project } = useProject(isProjectScoped ? projectId! : 0);

  const {
    notes: { data: globalPinnedNotes = [] },
  } = useNotes({ pinned: true }, { enabled: !isProjectScoped });
  const {
    notes: { data: globalFavouriteNotes = [] },
  } = useNotes({ favourite: true }, { enabled: !isProjectScoped });
  const {
    notes: { data: globalAllNotes = [] },
  } = useNotes({ search: debouncedSearch || undefined }, { enabled: !isProjectScoped });

  const {
    notes: { data: projectPinnedNotes = [] },
  } = useProjectNotes(isProjectScoped ? projectId! : 0, { pinned: true });
  const {
    notes: { data: projectFavouriteNotes = [] },
  } = useProjectNotes(isProjectScoped ? projectId! : 0, { favourite: true });
  const {
    notes: { data: projectAllNotesRaw = [] },
  } = useProjectNotes(isProjectScoped ? projectId! : 0);

  const projectAllNotes = debouncedSearch
    ? projectAllNotesRaw.filter((n) => noteMatchesSearch(n, debouncedSearch))
    : projectAllNotesRaw;

  const pinnedNotes = isProjectScoped ? projectPinnedNotes : globalPinnedNotes;
  const favouriteNotes = isProjectScoped ? projectFavouriteNotes : globalFavouriteNotes;
  const allNotes = isProjectScoped ? projectAllNotes : globalAllNotes;

  const pinnedIds = new Set(pinnedNotes.map((n) => n.id));
  const favouriteIds = new Set(favouriteNotes.map((n) => n.id));
  const filteredPinned = pinnedNotes;
  const filteredRest = allNotes.filter((n) => !pinnedIds.has(n.id));

  const totalCount = allNotes.length;
  const hasResults = filteredPinned.length + filteredRest.length > 0;

  const openNote = (noteId: number) => navigate(`/notes/${noteId}`);
  const createNotePath = isProjectScoped ? `/notes/new?projectId=${projectId}` : "/notes/new";

  const renderGrid = (notes: Note[], pinned = false) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {notes.map((n) => (
        <NoteCard key={n.id} note={n} pinned={pinned} favourite={favouriteIds.has(n.id)} onClick={() => openNote(n.id)} />
      ))}
    </div>
  );

  const renderList = (notes: Note[], pinned = false) => (
    <div className="flex flex-col gap-2">
      {notes.map((n) => (
        <NoteCard key={n.id} note={n} pinned={pinned} favourite={favouriteIds.has(n.id)} onClick={() => openNote(n.id)} list />
      ))}
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0f1014]">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/[0.06]">
          <div>
            {isProjectScoped && (
              <button
                onClick={() => navigate("/projects")}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-200 transition-colors mb-1.5"
              >
                <ArrowLeft size={13} />
                Projekty
              </button>
            )}
            <h1 className="text-2xl font-bold text-gray-100 tracking-tight leading-none m-0">
              {isProjectScoped ? project.data?.name ?? "Projekt" : "Notatki"}
            </h1>
            <p className="text-xs text-gray-600 mt-1 m-0">
              {totalCount} notatek {isProjectScoped ? "w projekcie" : "łącznie"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] hover:border-indigo-500/40 focus-within:border-indigo-500/60 rounded-lg px-3 py-2 transition-colors duration-150 w-56">
              <Search size={15} className="text-gray-600" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Szukaj notatek..."
                className="bg-transparent text-sm text-gray-300 placeholder-gray-600 outline-none w-full"
              />
            </div>

            <div className="flex items-center gap-0.5 bg-white/[0.04] border border-white/[0.07] rounded-lg p-1">
              <button
                onClick={() => setView(NoteViewType.GRID)}
                className={`p-1.5 rounded-md transition-colors duration-150 ${
                  view === "grid"
                    ? "bg-indigo-500/20 text-indigo-400"
                    : "text-gray-600 hover:text-gray-400"
                }`}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setView(NoteViewType.LIST)}
                className={`p-1.5 rounded-md transition-colors duration-150 ${
                  view === "list"
                    ? "bg-indigo-500/20 text-indigo-400"
                    : "text-gray-600 hover:text-gray-400"
                }`}
              >
                <List size={15} />
              </button>
            </div>

            <button
              onClick={() => navigate(createNotePath)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors duration-150"
            >
              <Plus size={15} />
              Nowa notatka
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {!hasResults && debouncedSearch ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600">
              <p className="text-lg font-medium">Brak wyników</p>
              <p className="text-sm mt-1">Spróbuj innej frazy</p>
            </div>
          ) : (
            <>
              {pinnedNotes.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <Pin size={13} className="text-amber-400/70" />
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 m-0">
                      Przypięte
                    </h2>
                  </div>
                  {view === "grid"
                    ? renderGrid(filteredPinned, true)
                    : renderList(filteredPinned, true)}
                </section>
              )}

              <section>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3 m-0">
                  Wszystkie notatki
                </h2>
                {filteredRest.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                    <p className="text-sm">Brak notatek. Utwórz pierwszą!</p>
                  </div>
                ) : view === "grid" ? (
                  renderGrid(filteredRest)
                ) : (
                  renderList(filteredRest)
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
