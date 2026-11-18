import { useFormatter, useTranslations } from "use-intl";

export function useFormatDate() {
  const format = useFormatter();
  const t = useTranslations("dates");

  return (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - date.getTime()) / 60_000);
    const diffH = Math.floor(diffMin / 60);
    const diffD = Math.floor(diffH / 24);
    if (diffMin < 60) return format.relativeTime(date, { now, unit: "minute" });
    if (diffH < 24) return format.relativeTime(date, { now, unit: "hour" });
    if (diffD === 1) return t("yesterday");
    if (diffD < 7) return format.relativeTime(date, { now, unit: "day" });
    return format.dateTime(date, { day: "numeric", month: "short" });
  };
}
