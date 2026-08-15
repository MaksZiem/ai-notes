import { useState, type FormEvent } from "react";
import { Search, Plus, LayoutGrid, List, Pin, X } from "lucide-react";
import Sidebar from "../components/layout/SideBar/SideBar";
import { useNotes } from "../hooks/useNotes";
import { useProjects } from "../hooks/useProjects";
import { useDebounce } from "../hooks/useDebounce";
import type { Note } from "../types/note";
import { NoteCard } from "../components/layout/NoteCard";
import { NoteViewType } from "../enums/noteView";

export default function NotesPage() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<NoteViewType>(NoteViewType.GRID);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newProjectId, setNewProjectId] = useState<string>("");

  const debouncedSearch = useDebounce(search, 300);

  const {
    notes: { data: pinnedNotes = [] },
  } = useNotes({ pinned: true });
  const {
    notes: { data: favouriteNotes = [] },
  } = useNotes({ favourite: true });
  const {
    notes: { data: allNotes = [] },
    createNote,
  } = useNotes({ search: debouncedSearch || undefined });
  const { projects } = useProjects();

  const pinnedIds = new Set(pinnedNotes.map((n) => n.id));
  const favouriteIds = new Set(favouriteNotes.map((n) => n.id));
  const filteredPinned = pinnedNotes;
  const filteredRest = allNotes.filter((n) => !pinnedIds.has(n.id));

  const totalCount = allNotes.length;
  const hasResults = filteredPinned.length + filteredRest.length > 0;

  const handleCreateNote = (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createNote.mutate(
      {
        title: newTitle.trim(),
        content: newContent.trim() || undefined,
        projectId: newProjectId ? Number(newProjectId) : undefined,
      },
      {
        onSuccess: () => {
          setNewTitle("");
          setNewContent("");
          setNewProjectId("");
          setIsCreateOpen(false);
        },
      }
    );
  };

  const renderGrid = (notes: Note[], pinned = false) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {notes.map((n) => (
        <NoteCard key={n.id} note={n} pinned={pinned} favourite={favouriteIds.has(n.id)} />
      ))}
    </div>
  );

  const renderList = (notes: Note[], pinned = false) => (
    <div className="flex flex-col gap-2">
      {notes.map((n) => (
        <NoteCard key={n.id} note={n} pinned={pinned} favourite={favouriteIds.has(n.id)} list />
      ))}
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0f1014]">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/[0.06]">
          <div>
            <h1 className="text-2xl font-bold text-gray-100 tracking-tight leading-none m-0">
              Notatki
            </h1>
            <p className="text-xs text-gray-600 mt-1 m-0">
              {totalCount} notatek łącznie
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
              onClick={() => setIsCreateOpen(true)}
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

      {isCreateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setIsCreateOpen(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateNote}
            className="w-full max-w-sm bg-[#1a1b23] border border-white/[0.08] rounded-2xl p-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-gray-100 m-0">Nowa notatka</h2>
              <button type="button" onClick={() => setIsCreateOpen(false)} className="text-gray-500 hover:text-gray-300">
                <X size={16} />
              </button>
            </div>

            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Tytuł notatki"
              className="bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500/60 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none"
            />
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Treść (opcjonalnie)"
              rows={4}
              className="bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500/60 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none resize-none"
            />
            <select
              value={newProjectId}
              onChange={(e) => setNewProjectId(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500/60 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none"
            >
              <option value="">Notatka prywatna</option>
              {(projects.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {createNote.isError && (
              <p className="text-xs text-red-400">Nie udało się utworzyć notatki</p>
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
                disabled={!newTitle.trim() || createNote.isPending}
                className="px-4 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white"
              >
                {createNote.isPending ? "Tworzenie..." : "Utwórz"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
