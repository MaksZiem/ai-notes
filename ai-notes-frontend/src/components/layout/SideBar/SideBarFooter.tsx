import { LogOut } from "lucide-react";
import { useCurrentUser } from "../../../hooks/useCurrentUser"
import { useAuth } from "../../../context/AuthContext";

export default function SideBarFooter() {
  const { logout } = useAuth();
  const { data: user } = useCurrentUser();
  
  return (
    <div className="px-2 pb-3 pt-2 border-t border-white/[0.07]">
    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-white/[0.03] border border-white/[0.07] mb-1.5">
      <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {user ? (user.name?.[0] ?? user.email[0]).toUpperCase() : "?"}
        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border-2 border-[#13141a]" />
      </div>
      <div className="overflow-hidden flex-1">
        <p className="text-[12.5px] font-semibold text-gray-200 truncate">
          {user ? `${user.name} ${user.surname}` : "Ładowanie..."}
        </p>
        <p className="text-[10.5px] text-gray-600">
          {user?.role === "ADMIN" ? "Administrator" : "Użytkownik"}
        </p>
      </div>
    </div>

    <button
      onClick={logout}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
    >
      <LogOut size={15} />
      Wyloguj się
    </button>
  </div>
  )
}