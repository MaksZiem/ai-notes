import { useEffect, useRef, useState } from "react";
import { ChevronDown, X, type LucideIcon } from "lucide-react";
import { TEXT_COLORS } from "./editorColors";

interface ColorPickerButtonProps {
  icon: LucideIcon;
  title: string;
  activeColor?: string;
  colors?: string[];
  onSelect: (color: string) => void;
  onClear: () => void;
}

export function ColorPickerButton({ icon: Icon, title, activeColor, colors = TEXT_COLORS, onSelect, onClear }: ColorPickerButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        title={title}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-0.5 p-1.5 rounded-md transition-colors ${
          activeColor ? "text-indigo-400 bg-indigo-500/10" : "text-gray-500 hover:text-gray-200 hover:bg-white/5"
        }`}
      >
        <Icon size={14} style={activeColor ? { color: activeColor } : undefined} />
        <ChevronDown size={10} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-20 bg-[#1e1f29] border border-white/10 rounded-xl shadow-2xl p-2 w-44">
          <div className="grid grid-cols-4 gap-1.5 mb-1.5">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => {
                  onSelect(c);
                  setOpen(false);
                }}
                className="w-7 h-7 rounded-full flex-shrink-0 border border-white/10"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              onClear();
              setOpen(false);
            }}
            className="w-full flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] text-gray-400 hover:bg-white/5 hover:text-gray-200"
          >
            <X size={11} />
            Usuń kolor
          </button>
        </div>
      )}
    </div>
  );
}
