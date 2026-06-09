'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronDown, Globe2, ShieldCheck } from 'lucide-react';
import { localeNames, useLocale, type Locale } from './LocaleProvider';

const localeFlags: Record<Locale, string> = { en: 'US', es: 'ES', pt: 'BR', fr: 'FR' };

const headerCopy: Record<Locale, { tagline: string; matches: string; agreements: string; leaderboard: string; language: string }> = {
  en: { tagline: 'World Cup escrow challenges', matches: 'Matches', agreements: 'Agreements', leaderboard: 'Leaderboard', language: 'Language' },
  es: { tagline: 'Challenges escrow del Mundial', matches: 'Partidos', agreements: 'Acuerdos', leaderboard: 'Ranking', language: 'Idioma' },
  pt: { tagline: 'Challenges escrow da Copa', matches: 'Jogos', agreements: 'Acordos', leaderboard: 'Ranking', language: 'Idioma' },
  fr: { tagline: 'Challenges escrow de la Coupe', matches: 'Matchs', agreements: 'Accords', leaderboard: 'Classement', language: 'Langue' },
};

export default function Header() {
  const { locale, setLocale } = useLocale();
  const [languageOpen, setLanguageOpen] = useState(false);
  const languageRef = useRef<HTMLDivElement>(null);
  const t = headerCopy[locale];

  useEffect(() => {
    function closeMenu(event: MouseEvent) {
      if (!languageRef.current?.contains(event.target as Node)) setLanguageOpen(false);
    }
    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setLanguageOpen(false);
    }
    document.addEventListener('mousedown', closeMenu);
    document.addEventListener('keydown', closeWithEscape);
    return () => {
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('keydown', closeWithEscape);
    };
  }, []);

  return (
    <header className="app-header sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="brand-mark"><ShieldCheck size={21} strokeWidth={2.4} /></div>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[15px] font-black text-white sm:text-lg">
              EscrowBet<span className="text-[#73f7ae]">.cool</span>
            </span>
            <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">{t.tagline}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/#matches" className="escrow-nav-link">{t.matches}</Link>
          <Link href="/#agreements" className="escrow-nav-link">{t.agreements}</Link>
          <Link href="/#leaderboard" className="escrow-nav-link">{t.leaderboard}</Link>
        </nav>

        <div className="language-menu" ref={languageRef}>
          <button
            type="button"
            className="language-trigger"
            aria-label={t.language}
            aria-haspopup="listbox"
            aria-expanded={languageOpen}
            onClick={() => setLanguageOpen((open) => !open)}
          >
            <Globe2 size={17} aria-hidden="true" />
            <span className="language-code">{locale.toUpperCase()}</span>
            <ChevronDown size={15} className={languageOpen ? 'language-chevron-open' : ''} aria-hidden="true" />
          </button>

          {languageOpen && (
            <div className="language-popover" role="listbox" aria-label={t.language}>
              <div className="language-popover-title">{t.language}</div>
              {(Object.keys(localeNames) as Locale[]).map((key) => (
                <button
                  type="button"
                  key={key}
                  role="option"
                  aria-selected={locale === key}
                  className={`language-option ${locale === key ? 'language-option-active' : ''}`}
                  onClick={() => {
                    setLocale(key);
                    setLanguageOpen(false);
                  }}
                >
                  <span className={`language-flag language-flag-${key}`} aria-hidden="true">{localeFlags[key]}</span>
                  <span>
                    <strong>{localeNames[key]}</strong>
                    <small>{key.toUpperCase()}</small>
                  </span>
                  {locale === key && <Check size={17} aria-hidden="true" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
