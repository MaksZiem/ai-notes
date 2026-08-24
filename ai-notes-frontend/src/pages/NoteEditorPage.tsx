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
import Sidebar from "../components/layout/SideBar/SideBar";
import { EditorToolbar } from "../components/editor/EditorToolbar";
import { SlashCommand } from "../components/editor/SlashCommand";
import { NOTE_ACCENT_COLORS } from "../components/editor/editorColors";
import { useNote } from "../hooks/useNote";
import { useNotes } from "../hooks/useNotes";
import { useProjects } from "../hooks/useProjects";
import { useDebouncedCallback } from "../hooks/useDebouncedCallback";
import { useAiTitle } from "../hooks/useAiTitle";
import { useAiKeywords } from "../hooks/useAiKeywords";
import { useNoteShareLinks } from "../hooks/useNoteShareLinks";
import { useCurrentUser } from "../hooks/useCurrentUser";
import Collaboration, { isChangeOrigin } from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import { ShareDialog } from "../components/editor/ShareDialog";
import {
  ArrowLeft,
  Trash2,
  Pin,
  Star,
  Loader2,
  Check,
  X,
  Sparkles,
  Share2,
  LogOut,
  Download,
} from "lucide-react";
import { downloadNoteAsMarkdown } from "../utils/downloadNotes";

const COLOR_PALETTE = NOTE_ACCENT_COLORS;

type SaveStatus = "idle" | "saving" | "saved" | "error";

function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-gray-500">
        <Loader2 size={12} className="animate-spin" />
        Zapisywanie...
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-500">
        <Check size={12} />
        Zapisano
      </span>
    );
  }
  if (status === "error") {
    return <span className="text-xs text-red-400">Nie udało się zapisać</span>;
  }
  return null;
}

function AutoResizeTitle({
  value,
  onChange,
  placeholder,
  color,
  readOnly,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  color?: string;
  readOnly?: boolean;
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
      readOnly={readOnly}
      style={color ? { color } : undefined}
      placeholder={placeholder}
      rows={1}
      className="w-full bg-transparent text-4xl font-bold text-gray-100 placeholder-gray-700 outline-none resize-none overflow-hidden leading-tight disabled:opacity-70"
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

  const [summary, setSummary] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<number | null>(
    isNew ? null : Number(routeId),
  );
  const [title, setTitle] = useState("");
  const [color, setColor] = useState<string | undefined>(undefined);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordDraft, setKeywordDraft] = useState("");
  const [projectId, setProjectId] = useState<number | undefined>(
    isNew ? initialProjectId : undefined,
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [shareOpen, setShareOpen] = useState(false);
  const [hasSyncedFields, setHasSyncedFields] = useState(false);
  const hasSyncedContentRef = useRef(false);

  const {
    note,
    members,
    updateNote,
    togglePin,
    toggleFavourite,
    deleteNote,
    leaveNote,
    moveNote,
    summarizeNote,
  } = useNote(savedId ?? 0);
  const { shareLinks } = useNoteShareLinks(savedId ?? 0);
  const currentUser = useCurrentUser();
  const { createNote } = useNotes();
  const { notes: pinnedNotes } = useNotes({ pinned: true });
  const { notes: favouriteNotes } = useNotes({ favourite: true });
  const { projects } = useProjects();
  const aiTitle = useAiTitle();
  const aiKeywords = useAiKeywords();

  const isOwner =
    !savedId ||
    !note.data ||
    !currentUser.data ||
    note.data.ownerId === currentUser.data.id;
  // Notatka jeszcze nieistniejąca (draft) — zawsze edytowalna przez twórcę.
  // Istniejąca notatka — o edytowalności decyduje accessLevel zwrócony przez backend.
  const canEdit = !savedId || !note.data || note.data.accessLevel !== "VIEW";
  const isShared =
    isOwner &&
    ((members.data?.length ?? 0) > 0 || (shareLinks.data?.length ?? 0) > 0);
  // Łączymy się z każdą istniejącą notatką, także przy samym VIEW — backend
  // (onAuthenticate) oznacza wtedy połączenie jako readOnly i po cichu odrzuca
  // każdą przychodzącą aktualizację dokumentu, więc viewer dostaje żywe zmiany
  // od innych, ale sam nic nie zapisze (a i tak `canEdit` blokuje mu edytor lokalnie).
  const isCollabEligible = !isNew && !!savedId;

  const [collab, setCollab] = useState<{ provider: HocuspocusProvider; doc: Y.Doc } | null>(null);

  useEffect(() => {
    if (!isCollabEligible || !savedId) {
      return;
    }
    const provider = new HocuspocusProvider({
      url: "ws://localhost:1234",
      name: String(savedId),
      token: () => localStorage.getItem("token") ?? "",
      onAuthenticated: () => {
        setCollab({ provider, doc: provider.document });
      },
    });

    return () => {
      provider.destroy();
      setCollab(null);
    };
  }, [isCollabEligible, savedId]);

  const cursorColor =
    COLOR_PALETTE[(currentUser.data?.id ?? 0) % COLOR_PALETTE.length];

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          link: { openOnClick: false, autolink: true },
          ...(collab ? { undoRedo: false as const } : {}),
        }),
        Placeholder.configure({
          placeholder: "Napisz coś, albo wpisz „/” po komendy…",
        }),
        TaskList,
        TaskItem.configure({ nested: true }),
        TextStyle,
        Color,
        Highlight.configure({ multicolor: true }),
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        TableKit.configure({ table: { resizable: true } }),
        ImageExtension.configure({
          HTMLAttributes: { class: "note-editor-image" },
        }),
        Markdown.configure({ html: true, transformPastedText: true }),
        SlashCommand,
        ...(collab
          ? [
              Collaboration.configure({ document: collab.doc }),
              CollaborationCaret.configure({
                provider: collab.provider,
                user: {
                  name: currentUser.data
                    ? `${currentUser.data.name} ${currentUser.data.surname}`
                    : "Ktoś",
                  color: cursorColor,
                },
              }),
            ]
          : []),
      ],
      editable: canEdit,
      editorProps: {
        attributes: { class: "note-editor-content" },
      },
      onUpdate: ({ transaction }) => {
        // Zmiany zsynchronizowane od innego użytkownika przez Yjs też trafiają
        // tutaj (to zwykła transakcja ProseMirror) — nie zapisujemy ich
        // ponownie przez REST, bo Hocuspocus już je trwale zapisał.
        if (isChangeOrigin(transaction)) return;
        triggerAutosaveRef.current();
      },
    },
    [collab],
  );

  useEffect(() => {
    editor?.setEditable(canEdit);
  }, [editor, canEdit]);

  if (!isNew && note.data && !hasSyncedFields) {
    setHasSyncedFields(true);
    setTitle(note.data.title);
    setColor(note.data.color);
    setKeywords(note.data.keywords ?? []);
    setProjectId(note.data.projectId ?? undefined);
  }

  useEffect(() => {
    if (
      !isNew &&
      note.data &&
      editor &&
      !hasSyncedContentRef.current &&
      !collab
    ) {
      editor.commands.setContent(note.data.content ?? "", {
        emitUpdate: false,
      });
      hasSyncedContentRef.current = true;
    }
  }, [note.data, isNew, editor, collab]);

  // Współdzielona notatka: jeśli Y.Doc jest jeszcze pusty (nikt nigdy nie
  // edytował jej na żywo), zasiej go istniejącą treścią z bazy — tylko raz,
  // i tylko właściciel (żeby dwie osoby otwierające naraz nie zdublowały treści).
  useEffect(() => {
    if (!collab || !editor || !isOwner) return;
    const { provider, doc } = collab;
    const handleSynced = () => {
      const fragment = doc.getXmlFragment("default");
      if (fragment.length === 0 && note.data?.content) {
        editor.commands.setContent(note.data.content, { emitUpdate: true });
      }
    };
    provider.on("synced", handleSynced);
    return () => {
      provider.off("synced", handleSynced);
    };
  }, [editor, collab, note.data, isOwner]);

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
        await updateNote.mutateAsync({
          title: title.trim() || "Bez tytułu",
          content,
        });
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

  const handleGenerateTitle = () => {
    const content = editor?.storage.markdown.getMarkdown() ?? "";
    if (!content.trim()) return;
    aiTitle.mutate(content, {
      onSuccess: (generatedTitle) => handleTitleChange(generatedTitle),
    });
  };

  const persistField = async (patch: {
    color?: string | null;
    keywords?: string[];
  }) => {
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

  const handleProjectSelect = (rawValue: string) => {
    const newProjectId = rawValue ? Number(rawValue) : undefined;
    if (!savedId) {
      setProjectId(newProjectId);
      return;
    }
    moveNote.mutate(newProjectId ?? null, {
      onSuccess: () => setProjectId(newProjectId),
    });
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

  const handleSuggestKeywords = () => {
    const content = editor?.storage.markdown.getMarkdown() ?? "";
    if (!content.trim()) return;
    aiKeywords.mutate(content, {
      onSuccess: (suggested) => {
        const merged = [...keywords];
        for (const kw of suggested) {
          const clean = kw.trim();
          if (
            clean &&
            !merged.some((k) => k.toLowerCase() === clean.toLowerCase())
          ) {
            merged.push(clean);
          }
        }
        setKeywords(merged);
        persistField({ keywords: merged });
      },
    });
  };

  const backToNotesPath = projectId ? `/projects/${projectId}/notes` : "/notes";

  const handleDelete = () => {
    if (!savedId) {
      navigate(backToNotesPath);
      return;
    }
    if (!window.confirm("Usunąć tę notatkę? Tej operacji nie można cofnąć."))
      return;
    deleteNote.mutate(undefined, {
      onSuccess: () => navigate(backToNotesPath),
    });
  };

  const handleLeave = () => {
    if (!savedId) return;
    if (
      !window.confirm(
        "Opuścić tę notatkę? Zniknie z Twojej listy, ale zostanie u właściciela — w każdej chwili może udostępnić Ci ją ponownie.",
      )
    )
      return;
    leaveNote.mutate(undefined, {
      onSuccess: () => navigate(backToNotesPath),
    });
  };

  const currentProject = projects.data?.find((p) => p.id === projectId);
  const isPinned =
    !!savedId && (pinnedNotes.data ?? []).some((n) => n.id === savedId);
  const isFavourite =
    !!savedId && (favouriteNotes.data ?? []).some((n) => n.id === savedId);

  return (
    <div className="flex h-screen bg-[#0f1014]">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06] flex-shrink-0">
          <button
            onClick={() => navigate(backToNotesPath)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-200 transition-colors px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
          >
            <ArrowLeft size={15} />
            Notatki
          </button>

          <div className="flex items-center gap-3">
            <SaveStatusIndicator status={saveStatus} />

            {savedId && (
              <>
                {isShared && (
                  <button
                    onClick={() => setShareOpen(true)}
                    title="Ta notatka jest udostępniona — kliknij, żeby zarządzać dostępem"
                    className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-1 rounded-full transition-colors cursor-pointer"
                  >
                    <Share2 size={11} />
                    Udostępniona
                  </button>
                )}
                {isOwner && (
                  <button
                    onClick={() => setShareOpen(true)}
                    title="Udostępnij notatkę"
                    className="p-1.5 rounded-md text-gray-500 hover:text-indigo-400 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <Share2 size={15} />
                  </button>
                )}
                <button
                  onClick={() => togglePin.mutate()}
                  disabled={togglePin.isPending}
                  title="Przypnij / odepnij"
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${isPinned ? "text-amber-400" : "text-gray-500 hover:text-gray-200"}`}
                >
                  <Pin
                    size={15}
                    className={isPinned ? "fill-amber-400/30" : ""}
                  />
                </button>
                <button
                  onClick={() => toggleFavourite.mutate()}
                  disabled={toggleFavourite.isPending}
                  title="Dodaj / usuń z ulubionych"
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${isFavourite ? "text-amber-400" : "text-gray-500 hover:text-gray-200"}`}
                >
                  <Star
                    size={15}
                    className={isFavourite ? "fill-amber-400" : ""}
                  />
                </button>
                <button
                  onClick={() =>
                    downloadNoteAsMarkdown(
                      title,
                      editor?.storage.markdown.getMarkdown() ?? "",
                    )
                  }
                  title="Pobierz jako Markdown (.md)"
                  className="p-1.5 rounded-md text-gray-500 hover:text-gray-200 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <Download size={15} />
                </button>
              </>
            )}

            {isOwner ? (
              <button
                onClick={handleDelete}
                title="Usuń notatkę"
                className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <Trash2 size={15} />
              </button>
            ) : (
              savedId && (
                <button
                  onClick={handleLeave}
                  disabled={leaveNote.isPending}
                  title="Opuść notatkę — zniknie z Twojej listy, zostanie u właściciela"
                  className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <LogOut size={15} />
                </button>
              )
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-10 py-10">
            {/* Color + project meta */}
            <div className="flex items-center flex-wrap gap-4 mb-6">
              <span className="text-[11px] text-gray-600 uppercase tracking-wide">
                Kolor notatki
              </span>
              <div className="flex items-center gap-2">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleColorSelect(c)}
                    disabled={!canEdit}
                    title={c}
                    className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center transition-transform cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                      color === c
                        ? "ring-2 ring-offset-2 ring-offset-[#0f1014] ring-white scale-110"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && (
                      <Check size={12} className="text-white" strokeWidth={3} />
                    )}
                  </button>
                ))}
                {color && (
                  <button
                    onClick={() => handleColorSelect("")}
                    disabled={!canEdit}
                    title="Usuń kolor"
                    className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border border-white/15 text-gray-500 hover:text-gray-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              <span className="w-px h-4 bg-white/10" />

              {isOwner ? (
                <select
                  value={projectId ?? ""}
                  disabled={moveNote.isPending}
                  onChange={(e) => handleProjectSelect(e.target.value)}
                  title="Przenieś notatkę do innego projektu"
                  className="bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500/60 rounded-lg px-2.5 py-1 text-xs text-gray-300 outline-none disabled:opacity-50"
                >
                  <option value="">Notatka prywatna</option>
                  {(projects.data ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-gray-500">
                  {currentProject ? currentProject.name : "Notatka prywatna"}
                </span>
              )}

              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={handleGenerateTitle}
                  disabled={aiTitle.isPending || !canEdit}
                  title="Wygeneruj tytuł z treści (AI)"
                  className="flex items-center gap-1.5 text-[11px] font-medium text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 disabled:opacity-40 disabled:cursor-not-allowed px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                >
                  {aiTitle.isPending ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} />
                  )}
                  Generuj tytuł
                </button>

                {savedId && (
                  <button
                    onClick={() =>
                      summarizeNote.mutate(undefined, {
                        onSuccess: (res) => setSummary(res.data.summary),
                      })
                    }
                    disabled={summarizeNote.isPending}
                    title="Streść notatkę za pomocą AI"
                    className="flex items-center gap-1.5 text-[11px] font-medium text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 disabled:opacity-60 disabled:cursor-not-allowed px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                  >
                    {summarizeNote.isPending ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Sparkles size={12} />
                    )}
                    Streść notatkę
                  </button>
                )}
              </div>
            </div>

            {note.data &&
              currentUser.data &&
              note.data.ownerId !== currentUser.data.id && (
                <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-2.5 mb-6 text-sm text-gray-300">
                  <Share2 size={14} className="text-indigo-400 flex-shrink-0" />
                  Udostępnione przez{" "}
                  {note.data.owner
                    ? `${note.data.owner.name} ${note.data.owner.surname}`
                    : "innego użytkownika"}
                </div>
              )}

            {/* Title */}
            {(summary || summarizeNote.isPending) && (
              <div className="relative rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/15 via-purple-500/10 to-violet-500/5 px-5 py-4 mb-6 animate-fade-in-up">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-500/20 text-violet-300 flex-shrink-0">
                    <Sparkles size={13} />
                  </span>
                  <span className="text-[11px] font-semibold text-violet-300 tracking-wide uppercase">
                    Podsumowanie AI
                  </span>
                  {summary && !summarizeNote.isPending && (
                    <button
                      onClick={() => setSummary(null)}
                      title="Zamknij podsumowanie"
                      className="ml-auto text-gray-500 hover:text-gray-300 flex-shrink-0 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {summarizeNote.isPending ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-3 rounded-full bg-white/10 w-full" />
                    <div className="h-3 rounded-full bg-white/10 w-5/6" />
                    <div className="h-3 rounded-full bg-white/10 w-2/3" />
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-gray-200 m-0">
                    {summary}
                  </p>
                )}
              </div>
            )}
            <AutoResizeTitle
              value={title}
              onChange={handleTitleChange}
              placeholder="Bez tytułu"
              color={color}
              readOnly={!canEdit}
            />

            {/* Keywords */}
            <div className="flex items-center flex-wrap gap-1.5 mt-4 mb-6">
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md bg-white/[0.06] text-gray-300"
                >
                  {kw}
                  {canEdit && (
                    <button
                      onClick={() => removeKeyword(kw)}
                      className="text-gray-500 hover:text-gray-200 cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  )}
                </span>
              ))}
              {canEdit && (
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
              )}
              <button
                onClick={handleSuggestKeywords}
                disabled={aiKeywords.isPending || !canEdit}
                title="Zasugeruj słowa kluczowe (AI)"
                className="flex items-center gap-1.5 text-[11px] font-medium text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 disabled:opacity-40 disabled:cursor-not-allowed px-2.5 py-1 rounded-full transition-colors cursor-pointer"
              >
                {aiKeywords.isPending ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Sparkles size={12} />
                )}
                Zasugeruj słowa kluczowe
              </button>
            </div>

            {/* Toolbar */}
            {editor && canEdit && (
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

      {shareOpen && savedId && (
        <ShareDialog noteId={savedId} onClose={() => setShareOpen(false)} />
      )}
    </div>
  );
}

export default function NoteEditorPage() {
  const { id = "new" } = useParams<{ id: string }>();
  return <NoteEditor key={id} routeId={id} />;
}
