import { useRef, type ReactNode } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Minus,
  Undo2,
  Redo2,
  Baseline,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Table,
  ImagePlus,
  Rows3,
  Columns3,
  Trash2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { ColorPickerButton } from "./ColorPickerButton";
import { HIGHLIGHT_COLORS } from "./editorColors";
import { useImageUpload } from "../../hooks/useImageUpload";
import { useAiContinue } from "../../hooks/useAiContinue";
import { useAiRewrite } from "../../hooks/useAiRewrite";
import { AiRewriteButton, type RewriteMode } from "./AiRewriteButton";

interface ToolbarButtonProps {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: ReactNode;
}

function ToolbarButton({
  active = false,
  disabled = false,
  onClick,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`p-1.5 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        active
          ? "bg-indigo-500/20 text-indigo-400"
          : "text-gray-500 hover:text-gray-200 hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-5 bg-white/10 mx-1 flex-shrink-0" />;
}

export function EditorToolbar({ editor }: { editor: Editor }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageUpload = useImageUpload();

  const currentTextColor = editor.getAttributes("textStyle").color as
    | string
    | undefined;
  const currentHighlight = editor.getAttributes("highlight").color as
    | string
    | undefined;
  const inTable = editor.isActive("table");
  const aiContinue = useAiContinue();
  const aiRewrite = useAiRewrite();
  const { hasSelection } = useEditorState({
    editor,
    selector: ({ editor }) => ({ hasSelection: !editor.state.selection.empty }),
  });
  const handleImagePick = () => fileInputRef.current?.click();

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const url = await imageUpload.mutateAsync(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch {
      // upload failed — silently ignored, no partial state to roll back
    }
  };

  const handleContinue = () => {
    const { from } = editor.state.selection;
    const textBeforeCursor = editor.state.doc.textBetween(0, from, "\n", "\n");
    if (!textBeforeCursor.trim()) return;
    aiContinue.mutate(textBeforeCursor, {
      onSuccess: (continuation) => {
        editor.chain().focus().insertContentAt(from, continuation).run();
      },
    });
  };

  const handleRewrite = (mode: RewriteMode) => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, "\n", "\n");
    if (!selectedText.trim()) return;
    aiRewrite.mutate(
      { text: selectedText, mode },
      {
        onSuccess: (result) => {
          editor.chain().focus().insertContentAt({ from, to }, result).run();
        },
      },
    );
  };

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 rounded-xl border border-white/[0.07] bg-[#1a1b23] flex-wrap">
      <ToolbarButton
        title="Pogrubienie"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={14} />
      </ToolbarButton>
      <ToolbarButton
        title="Kursywa"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={14} />
      </ToolbarButton>
      <ToolbarButton
        title="Podkreślenie"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline size={14} />
      </ToolbarButton>
      <ToolbarButton
        title="Przekreślenie"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough size={14} />
      </ToolbarButton>
      <ToolbarButton
        title="Kod"
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code size={14} />
      </ToolbarButton>

      <Divider />

      <ColorPickerButton
        icon={Baseline}
        title="Kolor tekstu"
        activeColor={currentTextColor}
        onSelect={(c) => editor.chain().focus().setColor(c).run()}
        onClear={() => editor.chain().focus().unsetColor().run()}
      />
      <ColorPickerButton
        icon={Highlighter}
        title="Podświetlenie"
        activeColor={currentHighlight}
        colors={HIGHLIGHT_COLORS}
        onSelect={(c) =>
          editor.chain().focus().setHighlight({ color: c }).run()
        }
        onClear={() => editor.chain().focus().unsetHighlight().run()}
      />

      <Divider />

      <ToolbarButton
        title="Nagłówek 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 size={14} />
      </ToolbarButton>
      <ToolbarButton
        title="Nagłówek 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 size={14} />
      </ToolbarButton>
      <ToolbarButton
        title="Nagłówek 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 size={14} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        title="Do lewej"
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <AlignLeft size={14} />
      </ToolbarButton>
      <ToolbarButton
        title="Do środka"
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <AlignCenter size={14} />
      </ToolbarButton>
      <ToolbarButton
        title="Do prawej"
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <AlignRight size={14} />
      </ToolbarButton>
      <ToolbarButton
        title="Wyjustuj"
        active={editor.isActive({ textAlign: "justify" })}
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
      >
        <AlignJustify size={14} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        title="Lista punktowana"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={14} />
      </ToolbarButton>
      <ToolbarButton
        title="Lista numerowana"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={14} />
      </ToolbarButton>
      <ToolbarButton
        title="Lista zadań"
        active={editor.isActive("taskList")}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      >
        <ListChecks size={14} />
      </ToolbarButton>
      <ToolbarButton
        title="Cytat"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote size={14} />
      </ToolbarButton>
      <ToolbarButton
        title="Linia pozioma"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus size={14} />
      </ToolbarButton>

      <Divider />

      {!inTable ? (
        <ToolbarButton
          title="Wstaw tabelę"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          <Table size={14} />
        </ToolbarButton>
      ) : (
        <>
          <ToolbarButton
            title="Dodaj wiersz"
            onClick={() => editor.chain().focus().addRowAfter().run()}
          >
            <Rows3 size={14} />
          </ToolbarButton>
          <ToolbarButton
            title="Dodaj kolumnę"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
          >
            <Columns3 size={14} />
          </ToolbarButton>
          <ToolbarButton
            title="Usuń tabelę"
            onClick={() => editor.chain().focus().deleteTable().run()}
          >
            <Trash2 size={14} />
          </ToolbarButton>
        </>
      )}

      <ToolbarButton
        title="Wstaw obrazek"
        disabled={imageUpload.isPending}
        onClick={handleImagePick}
      >
        {imageUpload.isPending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <ImagePlus size={14} />
        )}
      </ToolbarButton>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        onChange={handleImageChange}
        className="hidden"
      />

      <Divider />

      <ToolbarButton
        title="Cofnij"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 size={14} />
      </ToolbarButton>
      <ToolbarButton
        title="Ponów"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 size={14} />
      </ToolbarButton>
      <Divider />
      <AiRewriteButton
        disabled={!hasSelection || aiRewrite.isPending}
        loading={aiRewrite.isPending}
        onSelect={handleRewrite}
      />
      <Divider />
      <ToolbarButton
        title="Kontynuuj pisanie (AI)"
        disabled={aiContinue.isPending}
        onClick={handleContinue}
      >
        {aiContinue.isPending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Sparkles size={14} />
        )}
      </ToolbarButton>
    </div>
  );
}
