import { useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2, Sparkles } from "lucide-react";

export type RewriteMode = "fix" | "improve" | "shorten" | "expand";

const OPTIONS: { mode: RewriteMode; label: string }[] = [
  { mode: "fix", label: "Popraw gramatykę" },
  { mode: "improve", label: "Ulepsz styl" },
  { mode: "shorten", label: "Skróć" },
  { mode: "expand", label: "Rozszerz" },
];

interface AiRewriteButtonProps {
  disabled: boolean;
  loading: boolean;
  onSelect: (mode: RewriteMode) => void;
}

export function AiRewriteButton({
  disabled,
  loading,
  onSelect,
}: AiRewriteButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        title="Popraw zaznaczenie (AI)"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-0.5 p-1.5 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-gray-500 hover:text-gray-200 hover:bg-white/5"
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Sparkles size={14} />
        )}
        <ChevronDown size={10} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-20 bg-[#1e1f29] border border-white/10 rounded-xl shadow-2xl p-1.5 w-44">
          {OPTIONS.map((opt) => (
            <button
              key={opt.mode}
              type="button"
              onClick={() => {
                onSelect(opt.mode);
                setOpen(false);
              }}
              className="w-full text-left px-2 py-1.5 rounded-lg text-[12px] text-gray-300 hover:bg-white/5 hover:text-gray-100"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
