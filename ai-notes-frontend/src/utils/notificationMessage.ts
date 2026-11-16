import { useTranslations } from "use-intl";
import type { Notification } from "../types/notification";

const KNOWN_TYPES = [
  "NOTE_SHARED",
  "NOTE_ACCESS_REVOKED",
  "SHARE_LINK_CLAIMED",
  "NOTE_INVITE",
  "PROJECT_SHARED",
  "PROJECT_ACCESS_REVOKED",
  "PROJECT_SHARE_LINK_CLAIMED",
  "PROJECT_INVITE",
] as const;

type KnownType = (typeof KNOWN_TYPES)[number];

function isKnownType(type: string): type is KnownType {
  return (KNOWN_TYPES as readonly string[]).includes(type);
}

export function useNotificationMessage() {
  const t = useTranslations();

  return (n: Notification): string => {
    if (!isKnownType(n.type)) return t("notifications.fallback");
    return t(`notifications.types.${n.type}`, {
      actor: n.actor ? `${n.actor.name} ${n.actor.surname}` : t("common.someone"),
      note: n.note?.title ?? t("notifications.noteFallback"),
      project: n.project?.name ?? t("notifications.projectFallback"),
    });
  };
}
