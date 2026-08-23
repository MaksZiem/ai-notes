import { useState } from "react";
import { Copy, Check, Trash2, X, Loader2, Mail, Link2 } from "lucide-react";
import { useNoteShareLinks } from "../../hooks/useNoteShareLinks";
import { useNote } from "../../hooks/useNote";
import type { AccessLevel } from "../../types/note-share-links";

const ACCESS_LEVEL_LABEL: Record<AccessLevel, string> = {
  VIEW: "Podgląd",
  EDIT: "Edycja",
  DELETE: "Pełny dostęp",
};

export function ShareDialog({
  noteId,
  onClose,
}: {
  noteId: number;
  onClose: () => void;
}) {
  const { shareLinks, createShareLink, revokeShareLink } =
    useNoteShareLinks(noteId);
  const { members, revokeAccess } = useNote(noteId);
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("VIEW");
  const [email, setEmail] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const buildUrl = (token: string) => `${window.location.origin}/shared/${token}`;

  const handleCreate = () => {
    createShareLink.mutate(
      {
        accessLevel,
        email: email.trim() || undefined,
        expiresInDays: expiresInDays ? Number(expiresInDays) : undefined,
      },
      { onSuccess: () => setEmail("") },
    );
  };

  const handleCopy = (id: number, token: string) => {
    navigator.clipboard.writeText(buildUrl(token));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#15161c] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Udostępnij notatkę</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-200 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3 mb-5">
          <div className="flex gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Poziom dostępu</label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value as AccessLevel)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              >
                <option value="VIEW">Tylko podgląd</option>
                <option value="EDIT">Podgląd i edycja</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Wygasa po (dniach)</label>
              <input
                type="number"
                min={1}
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                placeholder="bez wygasania"
                title="Po ilu dniach link wygaśnie (puste = bez wygasania)"
                className="w-32 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">E-mail odbiorcy (opcjonalnie)</label>
            <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="np. ktos@example.com"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleCreate}
              disabled={createShareLink.isPending}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2 transition cursor-pointer disabled:cursor-not-allowed"
            >
              {createShareLink.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : email.trim() ? (
                <Mail size={14} />
              ) : (
                <Link2 size={14} />
              )}
              {email.trim() ? "Wyślij" : "Utwórz link"}
            </button>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-2">
          Zaproszenia — czekają, aż ktoś otworzy link
        </p>
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
          {shareLinks.isLoading && (
            <p className="text-sm text-gray-500">Ładowanie…</p>
          )}
          {!shareLinks.isLoading && (shareLinks.data ?? []).length === 0 && (
            <p className="text-sm text-gray-500">Brak wysłanych zaproszeń.</p>
          )}
          {(shareLinks.data ?? []).map((link) => (
            <div
              key={link.id}
              className="flex items-center justify-between gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm text-gray-200 truncate flex items-center gap-2">
                  {link.email ?? "Link publiczny"}
                  <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                    nie odebrane
                  </span>
                </p>
                <p className="text-xs text-gray-500">
                  {link.accessLevel === "EDIT" ? "Edycja" : "Podgląd"}
                  {link.expiresAt &&
                    ` · wygasa ${new Date(link.expiresAt).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleCopy(link.id, link.token)}
                  title="Kopiuj link"
                  className="p-1.5 rounded-md text-gray-500 hover:text-gray-200 hover:bg-white/5 cursor-pointer"
                >
                  {copiedId === link.id ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <button
                  onClick={() => revokeShareLink.mutate(link.id)}
                  disabled={revokeShareLink.isPending}
                  title="Odwołaj link"
                  className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-white/10">
          <p className="text-xs text-gray-500 mb-2">
            Osoby, które już mają dostęp (zalogowane)
          </p>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {members.isLoading && (
              <p className="text-sm text-gray-500">Ładowanie…</p>
            )}
            {!members.isLoading && (members.data ?? []).length === 0 && (
              <p className="text-sm text-gray-500">
                Nikt tu jeszcze nie wszedł. Osoba z zaproszenia pojawi się
                dopiero, gdy otworzy link i zaloguje się lub założy konto.
              </p>
            )}
            {(members.data ?? []).map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm text-gray-200 truncate">
                    {member.user.name} {member.user.surname}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {member.user.email} · {ACCESS_LEVEL_LABEL[member.accessLevel]}
                  </p>
                </div>
                <button
                  onClick={() => revokeAccess.mutate(member.userId)}
                  disabled={revokeAccess.isPending}
                  title="Odbierz dostęp"
                  className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 flex-shrink-0 cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
