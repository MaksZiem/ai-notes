import type { Notification } from "../types/notification";

export function notificationMessage(n: Notification): string {
  const actorName = n.actor ? `${n.actor.name} ${n.actor.surname}` : "Ktoś";
  const noteTitle = n.note?.title ?? "notatkę";
  const projectName = n.project?.name ?? "projekt";

  switch (n.type) {
    case "NOTE_SHARED":
      return `${actorName} udostępnił(a) Ci notatkę „${noteTitle}"`;
    case "NOTE_ACCESS_REVOKED":
      return `${actorName} odebrał(a) Ci dostęp do notatki „${noteTitle}"`;
    case "SHARE_LINK_CLAIMED":
      return `${actorName} dołączył(a) do notatki „${noteTitle}" przez link`;
    case "NOTE_INVITE":
      return `${actorName} zaprosił(a) Cię do notatki „${noteTitle}"`;
    case "PROJECT_SHARED":
      return `${actorName} udostępnił(a) Ci projekt „${projectName}"`;
    case "PROJECT_ACCESS_REVOKED":
      return `${actorName} odebrał(a) Ci dostęp do projektu „${projectName}"`;
    case "PROJECT_SHARE_LINK_CLAIMED":
      return `${actorName} dołączył(a) do projektu „${projectName}" przez zaproszenie`;
    case "PROJECT_INVITE":
      return `${actorName} zaprosił(a) Cię do projektu „${projectName}"`;
    default:
      return "Nowe powiadomienie";
  }
}
