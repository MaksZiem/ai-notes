import { useLocale, useTranslations } from "use-intl";
import { LOCALES } from "../../i18n/config";
import { useSetLocale } from "../../i18n/LocaleProvider";

export default function LocaleSwitcher({ className = "" }: { className?: string }) {
  const t = useTranslations("common");
  const current = useLocale();
  const setLocale = useSetLocale();

  return (
    <div
      role="group"
      aria-label={t("language")}
      className={`inline-flex rounded-lg border border-white/[0.07] p-0.5 text-[11px] ${className}`}
    >
      {LOCALES.map((locale) => {
        const active = locale === current;
        return (
          <button
            key={locale}
            type="button"
            lang={locale}
            aria-pressed={active}
            title={t(`languages.${locale}`)}
            onClick={() => !active && setLocale(locale)}
            className={`min-w-8 rounded-md px-2 py-0.5 font-semibold uppercase transition-colors ${
              active ? "bg-white/[0.08] text-gray-200" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {locale}
          </button>
        );
      })}
    </div>
  );
}
