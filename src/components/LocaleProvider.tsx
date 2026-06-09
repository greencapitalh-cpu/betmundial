'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type Locale = 'en' | 'es' | 'pt' | 'fr';

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
  fr: 'Français',
};

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = (
        window.localStorage.getItem('escrowbet-locale')
        || window.localStorage.getItem('udochain-escrow-locale')
      ) as Locale | null;
      const browserLocale = window.navigator.language.slice(0, 2) as Locale;
      setLocaleState(
        saved && saved in localeNames
          ? saved
          : browserLocale in localeNames
            ? browserLocale
            : 'en',
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale: (nextLocale) => {
      setLocaleState(nextLocale);
      window.localStorage.setItem('escrowbet-locale', nextLocale);
    },
  }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used inside LocaleProvider');
  return context;
}
