import type { Notification } from "../types/notification";

export function notificationMessage(n: Notification): string {
  const actorName = n.actor ? `${n.actor.name} ${n.actor.surname}` : "Ktoś";
  const noteTitle = n.note?.title ?? "notatkę";

  switch (n.type) {
    case "NOTE_SHARED":
      return `${actorName} udostępnił(a) Ci notatkę „${noteTitle}"`;
    case "NOTE_ACCESS_REVOKED":
      return `${actorName} odebrał(a) Ci dostęp do notatki „${noteTitle}"`;
    case "SHARE_LINK_CLAIMED":
      return `${actorName} dołączył(a) do notatki „${noteTitle}" przez link`;
    default:
      return "Nowe powiadomienie";
  }
}
