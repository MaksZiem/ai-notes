import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSharedProject } from "../hooks/useSharedProject";
import { Loader2, Lock, FolderOpen, Check } from "lucide-react";

export default function ProjectInvitePage() {
  const { token = "" } = useParams<{ token: string }>();
  const { token: authToken } = useAuth();
  const { invite, claim } = useSharedProject(token);
  const [claimed, setClaimed] = useState(false);

  const handleClaim = () => {
    claim.mutate(undefined, { onSuccess: () => setClaimed(true) });
  };

  if (invite.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f1014] text-gray-400">
        <Loader2 className="animate-spin" size={20} />
      </div>
    );
  }

  if (invite.isError || !invite.data) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f1014] text-center px-4">
        <div>
          <Lock className="mx-auto mb-3 text-gray-600" size={28} />
          <p className="text-gray-300">
            To zaproszenie jest nieprawidłowe, wygasło lub zostało odwołane.
          </p>
        </div>
      </div>
    );
  }

  const { project, invitedBy, accessLevel } = invite.data;
  const accessLabel =
    accessLevel === "EDIT" ? "edycja" : accessLevel === "DELETE" ? "pełny dostęp" : "podgląd";

  return (
    <div className="flex h-screen items-center justify-center bg-[#0f1014] px-4">
      <div className="flex flex-col items-center gap-5 w-full max-w-sm bg-[#1a1b23] border border-white/[0.08] rounded-2xl p-7 text-center">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
          <FolderOpen size={22} className="text-indigo-400" />
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
            Zaproszenie do projektu
          </span>
          {/* nadpisujemy globalny styl h1 (index.css) klasami !important — inaczej wchodzi 56px */}
          <h1 className="!text-xl !font-semibold !tracking-normal !leading-snug !m-0 text-gray-100">
            „{project.name}"
          </h1>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <span className="text-gray-300 font-medium">
            {invitedBy ? `${invitedBy.name} ${invitedBy.surname}` : "Ktoś"}
          </span>
          <span>zaprasza Cię —</span>
          <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-300 text-xs font-medium">
            {accessLabel}
          </span>
        </div>

        <div className="w-full flex flex-col gap-2">
          {claimed ? (
            <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm">
              <Check size={16} /> Dołączono do projektu.{" "}
              <Link to="/projects" className="underline">
                Przejdź do projektów
              </Link>
            </div>
          ) : authToken ? (
            <button
              onClick={handleClaim}
              disabled={claim.isPending}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition cursor-pointer disabled:cursor-not-allowed"
            >
              {claim.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Zaakceptuj zaproszenie
            </button>
          ) : (
            <>
              <Link
                to={`/register?projectInviteToken=${token}`}
                className="w-full block text-center bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition"
              >
                Załóż konto, żeby dołączyć
              </Link>
              <Link
                to={`/login?projectInviteToken=${token}`}
                className="text-sm text-gray-500 hover:text-gray-300"
              >
                Masz już konto? Zaloguj się
              </Link>
            </>
          )}

          {claim.isError && (
            <p className="text-xs text-red-400">
              Nie udało się zaakceptować zaproszenia. Spróbuj ponownie.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
