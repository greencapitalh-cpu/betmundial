'use client';

import { useState } from 'react';
import Link from 'next/link';
import { localeNames, useLocale, type Locale } from './LocaleProvider';

const navLabels: Record<Locale, string[]> = {
  en: ['Fixture', 'Bets', 'Coupons', 'Admin', 'Verify'],
  es: ['Fixture', 'Apuestas', 'Cupones', 'Admin', 'Verificar'],
  pt: ['Tabela', 'Apostas', 'Cupons', 'Admin', 'Verificar'],
  fr: ['Calendrier', 'Paris', 'Coupons', 'Admin', 'Vérifier'],
};

const navHrefs = ['/#fixture', '/#apuestas', '/#cupones', '/admin', '/merchant'];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { locale, setLocale } = useLocale();
  const navLinks = navHrefs.map((href, index) => ({ href, label: navLabels[locale][index] }));

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050914]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 via-rose-400 to-emerald-300 flex items-center justify-center text-slate-950 font-black text-sm">
            GP
          </div>
          <span className="text-xl font-bold text-white">
            Golazo<span className="text-amber-300">Promo</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm text-slate-300 hover:text-amber-300 transition-colors rounded-md hover:bg-white/10"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <select
          value={locale}
          onChange={(event) => setLocale(event.target.value as Locale)}
          className="hidden h-10 rounded-md border border-white/10 bg-white/10 px-3 text-sm font-bold text-white outline-none lg:block"
          aria-label="Language"
        >
          {Object.entries(localeNames).map(([key, label]) => (
            <option key={key} value={key} className="bg-slate-950">{label}</option>
          ))}
        </select>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden text-slate-300 hover:text-white p-2"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <nav className="lg:hidden border-t border-white/10 bg-[#050914] px-4 py-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-sm text-slate-300 hover:text-amber-300 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
