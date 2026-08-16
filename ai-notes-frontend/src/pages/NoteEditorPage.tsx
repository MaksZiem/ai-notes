import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { TableKit } from "@tiptap/extension-table";
import ImageExtension from "@tiptap/extension-image";
import { Markdown } from "tiptap-markdown";
import { ArrowLeft, Trash2, Pin, Star, Loader2, Check, X } from "lucide-react";
import Sidebar from "../components/layout/SideBar/SideBar";
import { EditorToolbar } from "../components/editor/EditorToolbar";
import { SlashCommand } from "../components/editor/SlashCommand";
import { NOTE_ACCENT_COLORS } from "../components/editor/editorColors";
import { useNote } from "../hooks/useNote";
import { useNotes } from "../hooks/useNotes";
import { useProjects } from "../hooks/useProjects";
import { useDebouncedCallback } from "../hooks/useDebouncedCallback";

const COLOR_PALETTE = NOTE_ACCENT_COLORS;

type SaveStatus = "idle" | "saving" | "saved" | "error";

function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-gray-500">
        <Loader2 size={12} className="animate-spin" />Zapisywanie...
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-500">
        <Check size={12} />Zapisano
      </span>
    );
  }
  if (status === "error") {
    return <span className="text-xs text-red-400">Nie udało się zapisać</span>;
  }
  return null;
}

function AutoResizeTitle({ value, onChange, placeholder, color }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  color?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.preventDefault();
      }}
      style={color ? { color } : undefined}
      placeholder={placeholder}
      rows={1}
      className="w-full bg-transparent text-4xl font-bold text-gray-100 placeholder-gray-700 outline-none resize-none overflow-hidden leading-tight"
    />
  );
}

function NoteEditor({ routeId }: { routeId: string }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNew = routeId === "new";
  const initialProjectId = (() => {
    const raw = searchParams.get("projectId");
    return raw ? Number(raw) : undefined;
  })();

  const [savedId, setSavedId] = useState<number | null>(isNew ? null : Number(routeId));
  const [title, setTitle] = useState("");
  const [color, setColor] = useState<string | undefined>(undefined);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordDraft, setKeywordDraft] = useState("");
  const [projectId, setProjectId] = useState<number | undefined>(isNew ? initialProjectId : undefined);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [hasSyncedFields, setHasSyncedFields] = useState(false);
  const hasSyncedContentRef = useRef(false);

  const { note, updateNote, togglePin, toggleFavourite, deleteNote } = useNote(savedId ?? 0);
  const { createNote } = useNotes();
  const { notes: pinnedNotes } = useNotes({ pinned: true });
  const { notes: favouriteNotes } = useNotes({ favourite: true });
  const { projects } = useProjects();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: { openOnClick: false, autolink: true } }),
      Placeholder.configure({ placeholder: "Napisz coś, albo wpisz „/” po komendy…" }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TableKit.configure({ table: { resizable: true } }),
      ImageExtension.configure({ HTMLAttributes: { class: "note-editor-image" } }),
      Markdown.configure({ html: true, transformPastedText: true }),
      SlashCommand,
    ],
    editorProps: {
      attributes: { class: "note-editor-content" },
    },
    onUpdate: () => {
      triggerAutosaveRef.current();
    },
  });

  if (!isNew && note.data && !hasSyncedFields) {
    setHasSyncedFields(true);
    setTitle(note.data.title);
    setColor(note.data.color);
    setKeywords(note.data.keywords ?? []);
    setProjectId(note.data.projectId ?? undefined);
  }

  useEffect(() => {
    if (!isNew && note.data && editor && !hasSyncedContentRef.current) {
      editor.commands.setContent(note.data.content ?? "", { emitUpdate: false });
      hasSyncedContentRef.current = true;
    }
  }, [note.data, isNew, editor]);

  const triggerAutosave = useDebouncedCallback(async () => {
    if (!editor) return;
    const content = editor.storage.markdown.getMarkdown();
    setSaveStatus("saving");
    try {
      if (!savedId) {
        const res = await createNote.mutateAsync({
          title: title.trim() || "Bez tytułu",
          content,
          projectId,
          color,
          keywords,
        });
        setSavedId(res.data.id);
      } else {
        await updateNote.mutateAsync({ title: title.trim() || "Bez tytułu", content });
      }
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }, 700);

  const triggerAutosaveRef = useRef(triggerAutosave);
  useEffect(() => {
    triggerAutosaveRef.current = triggerAutosave;
  });

  const handleTitleChange = (value: string) => {
    setTitle(value);
    triggerAutosave();
  };

  const persistField = async (patch: { color?: string | null; keywords?: string[] }) => {
    setSaveStatus("saving");
    try {
      if (!savedId) {
        const res = await createNote.mutateAsync({
          title: title.trim() || "Bez tytułu",
          content: editor?.storage.markdown.getMarkdown() ?? "",
          projectId,
          color: (patch.color ?? color) || undefined,
          keywords: patch.keywords ?? keywords,
        });
        setSavedId(res.data.id);
      } else {
        await updateNote.mutateAsync(patch);
      }
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  };

  const handleColorSelect = (value: string | null) => {
    setColor(value ?? undefined);
    persistField({ color: value });
  };

  const addKeyword = () => {
    const value = keywordDraft.trim();
    if (!value || keywords.includes(value)) {
      setKeywordDraft("");
      return;
    }
    const next = [...keywords, value];
    setKeywords(next);
    setKeywordDraft("");
    persistField({ keywords: next });
  };

  const removeKeyword = (value: string) => {
    const next = keywords.filter((k) => k !== value);
    setKeywords(next);
    persistField({ keywords: next });
  };

  const backToNotesPath = projectId ? `/projects/${projectId}/notes` : "/notes";

  const handleDelete = () => {
    if (!savedId) {
      navigate(backToNotesPath);
      return;
    }
    if (!window.confirm("Usunąć tę notatkę? Tej operacji nie można cofnąć.")) return;
    deleteNote.mutate(undefined, { onSuccess: () => navigate(backToNotesPath) });
  };

  const currentProject = projects.data?.find((p) => p.id === projectId);
  const isPinned = !!savedId && (pinnedNotes.data ?? []).some((n) => n.id === savedId);
  const isFavourite = !!savedId && (favouriteNotes.data ?? []).some((n) => n.id === savedId);

  return (
    <div className="flex h-screen bg-[#0f1014]">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06] flex-shrink-0">
          <button
            onClick={() => navigate(backToNotesPath)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-200 transition-colors px-2 py-1.5 rounded-lg hover:bg-white/5"
          >
            <ArrowLeft size={15} />
            Notatki
          </button>

          <div className="flex items-center gap-3">
            <SaveStatusIndicator status={saveStatus} />

            {savedId && (
              <>
                <button
                  onClick={() => togglePin.mutate()}
                  disabled={togglePin.isPending}
                  title="Przypnij / odepnij"
                  className={`p-1.5 rounded-md transition-colors ${isPinned ? "text-amber-400" : "text-gray-500 hover:text-gray-200"}`}
                >
                  <Pin size={15} className={isPinned ? "fill-amber-400/30" : ""} />
                </button>
                <button
                  onClick={() => toggleFavourite.mutate()}
                  disabled={toggleFavourite.isPending}
                  title="Dodaj / usuń z ulubionych"
                  className={`p-1.5 rounded-md transition-colors ${isFavourite ? "text-amber-400" : "text-gray-500 hover:text-gray-200"}`}
                >
                  <Star size={15} className={isFavourite ? "fill-amber-400" : ""} />
                </button>
              </>
            )}

            <button
              onClick={handleDelete}
              title="Usuń notatkę"
              className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-10 py-10">
            {/* Color + project meta */}
            <div className="flex items-center flex-wrap gap-4 mb-6">
              <span className="text-[11px] text-gray-600 uppercase tracking-wide">Kolor notatki</span>
              <div className="flex items-center gap-2">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleColorSelect(c)}
                    title={c}
                    className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center transition-transform ${
                      color === c ? "ring-2 ring-offset-2 ring-offset-[#0f1014] ring-white scale-110" : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check size={12} className="text-white" strokeWidth={3} />}
                  </button>
                ))}
                {color && (
                  <button
                    onClick={() => handleColorSelect("")}
                    title="Usuń kolor"
                    className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border border-white/15 text-gray-500 hover:text-gray-300"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              <span className="w-px h-4 bg-white/10" />

              {isNew && !savedId ? (
                <select
                  value={projectId ?? ""}
                  onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : undefined)}
                  className="bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500/60 rounded-lg px-2.5 py-1 text-xs text-gray-300 outline-none"
                >
                  <option value="">Notatka prywatna</option>
                  {(projects.data ?? []).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-gray-500">
                  {currentProject ? currentProject.name : "Notatka prywatna"}
                </span>
              )}
            </div>

            {/* Title */}
            <AutoResizeTitle value={title} onChange={handleTitleChange} placeholder="Bez tytułu" color={color} />

            {/* Keywords */}
            <div className="flex items-center flex-wrap gap-1.5 mt-4 mb-6">
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md bg-white/[0.06] text-gray-300"
                >
                  {kw}
                  <button onClick={() => removeKeyword(kw)} className="text-gray-500 hover:text-gray-200">
                    <X size={10} />
                  </button>
                </span>
              ))}
              <input
                value={keywordDraft}
                onChange={(e) => setKeywordDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addKeyword();
                  }
                }}
                onBlur={addKeyword}
                placeholder="+ słowo kluczowe"
                className="bg-transparent text-[11px] text-gray-400 placeholder-gray-600 outline-none py-1 px-1 w-32"
              />
            </div>

            {/* Toolbar */}
            {editor && (
              <div className="sticky top-0 z-10 -mx-1 px-1 py-2 mb-4 bg-[#0f1014]/95 backdrop-blur">
                <EditorToolbar editor={editor} />
              </div>
            )}

            {/* Content */}
            <div className="border border-white/[0.07] focus-within:border-white/[0.14] rounded-xl px-4 py-3 transition-colors">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function NoteEditorPage() {
  const { id = "new" } = useParams<{ id: string }>();
  return <NoteEditor key={id} routeId={id} />;
}
