import { ChevronDown } from "lucide-react";
import { useState } from "react";

export default function Section({
  label, icon, children, badge, defaultOpen = true,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  badge?: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-widest text-gray-600 hover:text-gray-400 hover:bg-white/5 transition-colors duration-150"
      >
        <span className="text-indigo-400/70">{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        {badge !== undefined && badge > 0 && (
          <span className="bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-px rounded-full leading-4">
            {badge}
          </span>
        )}
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
        />
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-96" : "max-h-0"}`}>
        {children}
      </div>
    </div>
  );
} 