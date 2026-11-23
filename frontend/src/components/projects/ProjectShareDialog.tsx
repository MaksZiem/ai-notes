import { useState } from "react";
import { Copy, Check, Trash2, X, Loader2, Mail } from "lucide-react";
import { useFormatter, useTranslations } from "use-intl";
import { useProjectShareLinks } from "../../hooks/useProjectShareLinks";
import { useProject } from "../../hooks/useProject";
import type { ProjectMember } from "../../types/project";
import type { AccessLevel } from "../../types/project-share-links";

export function ProjectShareDialog({
  projectId,
  onClose,
}: {
  projectId: string;
  onClose: () => void;
}) {
  const t = useTranslations("sharing");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const { shareLinks, createShareLink, revokeShareLink } =
    useProjectShareLinks(projectId);
  const { members, grantAccess, revokeAccess } = useProject(projectId);
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("VIEW");
  const [email, setEmail] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const buildUrl = (token: string) => `${window.location.origin}/project-invites/${token}`;

  const handleCreate = () => {
    if (!email.trim()) return;
    createShareLink.mutate(
      {
        accessLevel,
        email: email.trim(),
        expiresInDays: expiresInDays ? Number(expiresInDays) : undefined,
      },
      { onSuccess: () => setEmail("") },
    );
  };

  const handleCopy = (id: string, token: string) => {
    navigator.clipboard.writeText(buildUrl(token));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#15161c] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">{t("project.title")}</h2>
          <button onClick={onClose} aria-label={tCommon("close")} className="text-gray-500 hover:text-gray-200 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-3">
          {t("project.intro")}
        </p>

        <div className="flex flex-col gap-3 mb-5">
          <div className="flex gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">{t("accessLevel")}</label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value as AccessLevel)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              >
                <option value="VIEW">{t("options.VIEW")}</option>
                <option value="EDIT">{t("options.EDIT")}</option>
                <option value="DELETE">{t("options.DELETE")}</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">{t("expires")}</label>
              <input
                type="number"
                min={1}
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                placeholder={t("noExpiry")}
                title={t("project.expiresHint")}
                className="w-32 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">{t("project.email")}</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleCreate}
                disabled={createShareLink.isPending || !email.trim()}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2 transition cursor-pointer disabled:cursor-not-allowed"
              >
                {createShareLink.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Mail size={14} />
                )}
                {t("project.send")}
              </button>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-2">
          {t("project.invites")}
        </p>
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
          {shareLinks.isLoading && (
            <p className="text-sm text-gray-500">{t("loading")}</p>
          )}
          {!shareLinks.isLoading && (shareLinks.data ?? []).length === 0 && (
            <p className="text-sm text-gray-500">{t("noInvites")}</p>
          )}
          {(shareLinks.data ?? []).map((link) => {
            const accepted = ((members.data ?? []) as ProjectMember[]).some(
              (m) => m.user.email === link.email,
            );
            return (
              <div
                key={link.id}
                className="flex items-center justify-between gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm text-gray-200 truncate flex items-center gap-2">
                    {link.email ?? t("project.link")}
                    {accepted ? (
                      <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        {t("accepted")}
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        {t("pending")}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t(`levels.${link.accessLevel}`)}
                    {link.expiresAt &&
                      t("expiresAt", { date: format.dateTime(new Date(link.expiresAt), { dateStyle: "short" }) })}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleCopy(link.id, link.token)}
                    title={t("copyLink")}
                    className="p-1.5 rounded-md text-gray-500 hover:text-gray-200 hover:bg-white/5 cursor-pointer"
                  >
                    {copiedId === link.id ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                  <button
                    onClick={() => revokeShareLink.mutate(link.id)}
                    disabled={revokeShareLink.isPending}
                    title={t("project.revoke")}
                    className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-4 border-t border-white/10">
          <p className="text-xs text-gray-500 mb-2">{t("project.members")}</p>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {members.isLoading && (
              <p className="text-sm text-gray-500">{t("loading")}</p>
            )}
            {!members.isLoading && (members.data ?? []).length === 0 && (
              <p className="text-sm text-gray-500">
                {t("project.noMembers")}
              </p>
            )}
            {((members.data ?? []) as ProjectMember[]).map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm text-gray-200 truncate">
                    {member.user.name} {member.user.surname}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {member.user.email}
                  </p>
                </div>
                <select
                  value={member.accessLevel}
                  onChange={(e) =>
                    grantAccess.mutate({
                      userId: member.userId,
                      accessLevel: e.target.value as AccessLevel,
                    })
                  }
                  disabled={grantAccess.isPending}
                  title={t("changeLevel")}
                  className="flex-shrink-0 bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs text-gray-300 outline-none focus:border-indigo-500"
                >
                  <option value="VIEW">{t("levels.VIEW")}</option>
                  <option value="EDIT">{t("levels.EDIT")}</option>
                  <option value="DELETE">{t("levels.DELETE")}</option>
                </select>
                <button
                  onClick={() => revokeAccess.mutate(member.userId)}
                  disabled={revokeAccess.isPending}
                  title={t("revokeAccess")}
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
