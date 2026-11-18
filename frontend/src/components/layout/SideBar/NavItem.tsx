import { useLocation } from "react-router-dom";

export default function NavItem({
  label, path, icon, badge, onClick, matchPrefix = false,
}: {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
  onClick: () => void;
  matchPrefix?: boolean;
}) {
  const location = useLocation();
  const active =
    location.pathname === path ||
    (matchPrefix && location.pathname.startsWith(`${path}/`));

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-medium transition-all duration-150 border
        ${active
          ? "bg-indigo-500/10 border-indigo-500/25 text-indigo-400"
          : "border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200"
        }`}
    >
      <span className={`flex-shrink-0 transition-opacity ${active ? "opacity-100" : "opacity-50"}`}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-px rounded-full leading-4">
          {badge}
        </span>
      )}
    </button>
  );
}