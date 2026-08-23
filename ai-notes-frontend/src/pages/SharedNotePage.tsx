import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSharedNote } from "../hooks/useSharedNote";
import { Loader2, Lock, Users } from "lucide-react";

export default function SharedNotePage() {
  const { token = "" } = useParams<{ token: string }>();
  const { token: authToken } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const { shared, save, claim } = useSharedNote(token);

  const handleSave = (value: string) =>
    save.mutate(
      { content: value },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 1500);
        },
      },
    );

  const handleClaim = () =>
    claim.mutate(undefined, {
      onSuccess: () => {
        if (shared.data) navigate(`/notes/${shared.data.note.id}`);
      },
    });

  if (shared.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f1014] text-gray-400">
        <Loader2 className="animate-spin" size={20} />
      </div>
    );
  }

  if (shared.isError || !shared.data) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f1014] text-center px-4">
        <div>
          <Lock className="mx-auto mb-3 text-gray-600" size={28} />
          <p className="text-gray-300">
            Ten link jest nieprawidłowy, wygasł lub został odwołany.
          </p>
        </div>
      </div>
    );
  }

  const { note, accessLevel } = shared.data;
  const value = content ?? note.content ?? "";

  return (
    <div className="min-h-screen bg-[#0f1014]">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3 mb-8 text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-indigo-400 flex-shrink-0" />
            Przeglądasz jako gość (
            {accessLevel === "EDIT" ? "możesz edytować" : "tylko podgląd"})
            {note.owner &&
              ` · udostępnił(a) ${note.owner.name} ${note.owner.surname}`}
          </div>
          {authToken ? (
            <button
              onClick={handleClaim}
              disabled={claim.isPending}
              className="flex-shrink-0 text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer disabled:cursor-not-allowed"
            >
              {claim.isPending ? "Dodawanie…" : "Dodaj do moich notatek"}
            </button>
          ) : (
            <Link
              to={`/register?shareToken=${token}`}
              className="flex-shrink-0 text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Załóż konto, żeby zachować dostęp
            </Link>
          )}
        </div>

        <h1 className="text-3xl font-bold text-gray-100 mb-6">{note.title}</h1>

        {accessLevel === "EDIT" ? (
          <>
            <textarea
              value={value}
              onChange={(e) => setContent(e.target.value)}
              onBlur={() => handleSave(value)}
              rows={20}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-gray-200 outline-none focus:border-indigo-500/60 resize-y"
            />
            {saved && (
              <p className="text-xs text-emerald-500 mt-2">Zapisano</p>
            )}
          </>
        ) : (
          <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">
            {value}
          </div>
        )}

        {!authToken && (
          <p className="text-sm text-gray-500 mt-8">
            Masz już konto?{" "}
            <Link to={`/login?shareToken=${token}`} className="text-indigo-400">
              Zaloguj się
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
