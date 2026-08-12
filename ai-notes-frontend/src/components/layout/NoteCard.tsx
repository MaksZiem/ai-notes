import { Pin, Clock } from "lucide-react";
import type { Note } from "../../types/note";
import { tagColor } from "../../utils/noteColors";
import { formatDate } from "../../utils/formatDate";
import { NOTE_DEFAULT_COLOR } from "../../consts/noteColor";

interface NoteCardProps {
  note: Note;
  list?: boolean;
  pinned?: boolean;
}

export function NoteCard({ note, list = false, pinned = false }: NoteCardProps) {
  const noteColor = note.color ?? NOTE_DEFAULT_COLOR;
  const projectColor = note.project?.color ?? NOTE_DEFAULT_COLOR;
  const keywords = note.keywords ?? [];
  const projectName = note.project?.name ?? "Notatka prywatna";

  if (list) {
    return (
      <div className="group flex items-start gap-4 px-5 py-4 bg-[#1a1b23] border border-white/[0.06] rounded-xl hover:border-indigo-500/30 hover:bg-[#1e1f29] transition-all duration-200 cursor-pointer">
        <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: noteColor }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {pinned && <Pin size={13} className="text-amber-400/70 flex-shrink-0" />}
            <h3 className="text-[14px] font-semibold text-gray-100 truncate">{note.title}</h3>
          </div>
          <p className="text-[12.5px] text-gray-500 truncate">{note.content}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden group-hover:flex items-center gap-1">
            {keywords.map(tag => (
              <span
                key={tag}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                style={{ backgroundColor: tagColor(tag).bg, color: tagColor(tag).text }}
              >
                {tag}
              </span>
            ))}
          </div>
          <span className="text-[11px] text-gray-600">{projectName}</span>
          <div className="flex items-center gap-1 text-[11px] text-gray-600">
            <Clock size={11} />{formatDate(note.updatedAt)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex flex-col bg-[#1a1b23] border border-white/[0.06] rounded-2xl p-5 hover:border-indigo-500/30 hover:bg-[#1e1f29] transition-all duration-200 cursor-pointer h-full">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {pinned && <Pin size={13} className="text-amber-400/80 flex-shrink-0" />}
          <h3 className="text-[14px] font-semibold text-gray-100 leading-snug truncate">{note.title}</h3>
        </div>
        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: noteColor }} />
      </div>

      <p className="text-[12.5px] text-gray-500 leading-relaxed line-clamp-3 flex-1 mb-4">
        {note.content}
      </p>

      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {keywords.map(tag => (
            <span
              key={tag}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
              style={{ backgroundColor: tagColor(tag).bg, color: tagColor(tag).text }}
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-gray-600 flex-shrink-0">
          <Clock size={11} />{formatDate(note.updatedAt)}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: projectColor }} />
        <span className="text-[11px] text-gray-600 truncate">{projectName}</span>
      </div>
    </div>
  );
}