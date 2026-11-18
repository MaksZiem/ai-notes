import type { Editor, Range } from "@tiptap/core";
import {
  Heading1, Heading2, Heading3, List, ListOrdered, ListChecks,
  Quote, Code2, Minus, Pilcrow, Table, type LucideIcon,
} from "lucide-react";

export type SlashCommandKey =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "bulletList"
  | "orderedList"
  | "taskList"
  | "quote"
  | "codeBlock"
  | "divider"
  | "table";

export interface SlashCommandItem {
  key: SlashCommandKey;
  icon: LucideIcon;
  command: (props: { editor: Editor; range: Range }) => void;
}

export const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    key: "paragraph",
    icon: Pilcrow,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    key: "heading1",
    icon: Heading1,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run(),
  },
  {
    key: "heading2",
    icon: Heading2,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run(),
  },
  {
    key: "heading3",
    icon: Heading3,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run(),
  },
  {
    key: "bulletList",
    icon: List,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    key: "orderedList",
    icon: ListOrdered,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    key: "taskList",
    icon: ListChecks,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  {
    key: "quote",
    icon: Quote,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    key: "codeBlock",
    icon: Code2,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    key: "divider",
    icon: Minus,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    key: "table",
    icon: Table,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
];
