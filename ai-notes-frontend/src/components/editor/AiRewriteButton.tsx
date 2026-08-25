import { useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2, Send, Sparkles, WandSparkles } from "lucide-react";

export type RewriteMode = "fix" | "improve" | "shorten" | "expand" | "custom";

const OPTIONS: { mode: RewriteMode; label: string }[] = [
  { mode: "fix", label: "Popraw gramatykę" },
  { mode: "improve", label: "Ulepsz styl" },
  { mode: "shorten", label: "Skróć" },
  { mode: "expand", label: "Rozszerz" },
];

interface AiRewriteButtonProps {
  hasSelection: boolean;
  rewriteLoading: boolean;
  continueLoading: boolean;
  generateLoading: boolean;
  onSelectMode: (mode: RewriteMode) => void;
  onContinue: () => void;
  onCustom: (instruction: string) => void;
  onGenerate: (prompt: string) => void;
}

export function AiRewriteButton({
  hasSelection,
  rewriteLoading,
  continueLoading,
  generateLoading,
  onSelectMode,
  onContinue,
  onCustom,
  onGenerate,
}: AiRewriteButtonProps) {
  const [open, setOpen] = useState(false);
  const [customInstruction, setCustomInstruction] = useState("");
  const [generatePrompt, setGeneratePrompt] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const loading = rewriteLoading || continueLoading || generateLoading;

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const submitCustom = () => {
    if (!customInstruction.trim() || !hasSelection) return;
    onCustom(customInstruction.trim());
    setCustomInstruction("");
    setOpen(false);
  };

  const submitGenerate = () => {
    if (!generatePrompt.trim()) return;
    onGenerate(generatePrompt.trim());
    setGeneratePrompt("");
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        title="Edytuj z AI"
        disabled={loading}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-violet-300 bg-violet-500/10 hover:bg-violet-500/20"
      >
        {loading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Sparkles size={12} />
        )}
        Narzędzia AI
        <ChevronDown size={10} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-20 bg-[#1e1f29] border border-white/10 rounded-xl shadow-2xl p-1.5 w-56">
          {OPTIONS.map((opt) => (
            <button
              key={opt.mode}
              type="button"
              disabled={!hasSelection || rewriteLoading}
              onClick={() => {
                onSelectMode(opt.mode);
                setOpen(false);
              }}
              className="w-full text-left px-2 py-1.5 rounded-lg text-[12px] text-gray-300 hover:bg-white/5 hover:text-gray-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            >
              {opt.label}
            </button>
          ))}

          <div className="h-px bg-white/10 my-1.5" />

          <button
            type="button"
            disabled={continueLoading}
            onClick={() => {
              onContinue();
              setOpen(false);
            }}
            className="w-full text-left px-2 py-1.5 rounded-lg text-[12px] text-gray-300 hover:bg-white/5 hover:text-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Kontynuuj pisanie
          </button>

          <div className="h-px bg-white/10 my-1.5" />

          <div className="px-2 pb-1">
            <label className="flex items-center gap-1 text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
              <WandSparkles size={10} />
              Własne polecenie
            </label>
            <div className="flex items-center gap-1">
              <input
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitCustom();
                  }
                }}
                disabled={!hasSelection || rewriteLoading}
                placeholder={
                  hasSelection ? "np. przetłumacz na angielski" : "Zaznacz tekst…"
                }
                className="flex-1 min-w-0 bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500/60 rounded-md px-2 py-1 text-[12px] text-gray-200 placeholder-gray-600 outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                title="Wykonaj polecenie"
                disabled={!hasSelection || !customInstruction.trim() || rewriteLoading}
                onClick={submitCustom}
                className="flex-shrink-0 p-1.5 rounded-md text-indigo-400 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send size={13} />
              </button>
            </div>
          </div>

          <div className="h-px bg-white/10 my-1.5" />

          <div className="px-2 pb-1">
            <label className="flex items-center gap-1 text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
              <Sparkles size={10} />
              Napisz notatkę o...
            </label>
            <div className="flex items-center gap-1">
              <input
                value={generatePrompt}
                onChange={(e) => setGeneratePrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitGenerate();
                  }
                }}
                disabled={generateLoading}
                placeholder="np. top 3 firmy IT w Polsce"
                className="flex-1 min-w-0 bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500/60 rounded-md px-2 py-1 text-[12px] text-gray-200 placeholder-gray-600 outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                title="Wygeneruj notatkę"
                disabled={!generatePrompt.trim() || generateLoading}
                onClick={submitGenerate}
                className="flex-shrink-0 p-1.5 rounded-md text-indigo-400 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                {generateLoading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Send size={13} />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
