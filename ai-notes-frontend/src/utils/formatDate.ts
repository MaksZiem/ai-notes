export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60_000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 60) return `${diffMin} min. temu`;
  if (diffH < 24) return `${diffH} godz. temu`;
  if (diffD === 1) return "wczoraj";
  if (diffD < 7) return `${diffD} dni temu`;
  return date.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}