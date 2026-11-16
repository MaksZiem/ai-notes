import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { IntlProvider } from "use-intl";
import pl from "../../messages/pl.json";
import en from "../../messages/en.json";
import { readLocaleCookie, writeLocaleCookie, type Locale } from "./config";

const MESSAGES = { pl, en };

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readLocaleCookie);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = MESSAGES[locale].meta.title;
  }, [locale]);

  function setLocale(next: Locale) {
    writeLocaleCookie(next);
    setLocaleState(next);
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <IntlProvider locale={locale} messages={MESSAGES[locale]} timeZone="Europe/Warsaw">
        {children}
      </IntlProvider>
    </LocaleContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSetLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useSetLocale must be used inside LocaleProvider");
  return context.setLocale;
}
