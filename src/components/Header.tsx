'use client';

import Link from 'next/link';
import { Globe2, ShieldCheck } from 'lucide-react';
import { localeNames, useLocale, type Locale } from './LocaleProvider';

export default function Header() {
  const { locale, setLocale } = useLocale();

  return (
    <header className="app-header sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="brand-mark">
            <ShieldCheck size={21} strokeWidth={2.4} />
          </div>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[15px] font-black text-white sm:text-lg">
              UDoChain <span className="text-[#73f7ae]">Challenge</span>
            </span>
            <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Escrow protocol · World Cup
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/#matches" className="escrow-nav-link">Matches</Link>
          <Link href="/#agreements" className="escrow-nav-link">Agreements</Link>
          <Link href="/#leaderboard" className="escrow-nav-link">Leaderboard</Link>
        </nav>

        <label className="language-control">
          <Globe2 size={17} aria-hidden="true" />
          <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)} aria-label="Language">
            {Object.entries(localeNames).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </label>
      </div>
    </header>
  );
}
