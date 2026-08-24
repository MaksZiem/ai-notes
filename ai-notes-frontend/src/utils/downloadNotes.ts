import JSZip from "jszip";
import type { Note } from "../types/note";

function sanitizeFilename(name: string): string {
  const cleaned = name.trim().replace(/[/\\?%*:|"<>]/g, "-");
  return cleaned || "Bez tytułu";
}

function noteToMarkdown(title: string, content: string): string {
  const heading = `# ${title.trim() || "Bez tytułu"}`;
  return content.trim() ? `${heading}\n\n${content}` : `${heading}\n`;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadNoteAsMarkdown(title: string, content: string) {
  const blob = new Blob([noteToMarkdown(title, content)], {
    type: "text/markdown;charset=utf-8",
  });
  triggerBlobDownload(blob, `${sanitizeFilename(title)}.md`);
}

export async function downloadNotesAsZip(notes: Note[], zipName: string) {
  const zip = new JSZip();
  const usedNames = new Map<string, number>();

  for (const note of notes) {
    const base = sanitizeFilename(note.title);
    const count = usedNames.get(base) ?? 0;
    usedNames.set(base, count + 1);
    const filename = count === 0 ? `${base}.md` : `${base} (${count}).md`;
    zip.file(filename, noteToMarkdown(note.title, note.content ?? ""));
  }

  const blob = await zip.generateAsync({ type: "blob" });
  triggerBlobDownload(blob, `${sanitizeFilename(zipName)}.zip`);
}
