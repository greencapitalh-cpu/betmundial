'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { localeNames, useLocale, type Locale } from './LocaleProvider';

type NavRole = 'portal' | 'fan' | 'merchant' | 'admin';

const roleBrand: Record<NavRole, { title: string; home: string }> = {
  portal: { title: 'GolazoPromo', home: '/' },
  fan: { title: 'Fan App', home: '/fan' },
  merchant: { title: 'Local Console', home: '/merchant' },
  admin: { title: 'Admin Console', home: '/admin' },
};

const navCopy: Record<Locale, Record<NavRole, Array<{ href: string; label: string }>>> = {
  en: {
    portal: [],
    fan: [
      { href: '/fan#fixture', label: 'Fixture' },
      { href: '/fan#predict', label: 'Predict' },
      { href: '/fan#vouchers', label: 'My vouchers' },
      { href: '/fan#promos', label: 'Promos' },
    ],
    merchant: [
      { href: '/merchant#rewards', label: 'Rewards' },
      { href: '/merchant#ads', label: 'Promos' },
      { href: '/merchant#verify', label: 'Verify QR' },
    ],
    admin: [
      { href: '/admin#publish', label: 'Publish' },
      { href: '/admin#board', label: 'Board' },
      { href: '/fan', label: 'Fan app' },
    ],
  },
  es: {
    portal: [],
    fan: [
      { href: '/fan#fixture', label: 'Fixture' },
      { href: '/fan#predict', label: 'Pronosticar' },
      { href: '/fan#vouchers', label: 'Mis vales' },
      { href: '/fan#promos', label: 'Promos' },
    ],
    merchant: [
      { href: '/merchant#rewards', label: 'Premios' },
      { href: '/merchant#ads', label: 'Promos' },
      { href: '/merchant#verify', label: 'Verificar QR' },
    ],
    admin: [
      { href: '/admin#publish', label: 'Publicar' },
      { href: '/admin#board', label: 'Tablero' },
      { href: '/fan', label: 'App usuario' },
    ],
  },
  pt: {
    portal: [],
    fan: [
      { href: '/fan#fixture', label: 'Tabela' },
      { href: '/fan#predict', label: 'Apostar' },
      { href: '/fan#vouchers', label: 'Meus cupons' },
      { href: '/fan#promos', label: 'Promos' },
    ],
    merchant: [
      { href: '/merchant#rewards', label: 'Premios' },
      { href: '/merchant#ads', label: 'Promos' },
      { href: '/merchant#verify', label: 'Verificar QR' },
    ],
    admin: [
      { href: '/admin#publish', label: 'Publicar' },
      { href: '/admin#board', label: 'Painel' },
      { href: '/fan', label: 'App usuario' },
    ],
  },
  fr: {
    portal: [],
    fan: [
      { href: '/fan#fixture', label: 'Calendrier' },
      { href: '/fan#predict', label: 'Pronostiquer' },
      { href: '/fan#vouchers', label: 'Mes coupons' },
      { href: '/fan#promos', label: 'Promos' },
    ],
    merchant: [
      { href: '/merchant#rewards', label: 'Prix' },
      { href: '/merchant#ads', label: 'Promos' },
      { href: '/merchant#verify', label: 'Verifier QR' },
    ],
    admin: [
      { href: '/admin#publish', label: 'Publier' },
      { href: '/admin#board', label: 'Tableau' },
      { href: '/fan', label: 'App fan' },
    ],
  },
};

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { locale, setLocale } = useLocale();
  const pathname = usePathname();
  const role: NavRole = pathname.startsWith('/merchant') ? 'merchant' : pathname.startsWith('/admin') ? 'admin' : pathname.startsWith('/fan') ? 'fan' : 'portal';
  const brand = roleBrand[role];
  const navLinks = navCopy[locale][role];

  return (
    <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${role === 'fan' ? 'upperdeck-app-header border-white/10' : 'border-white/10 bg-[#050914]/90'}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href={brand.home} className="flex items-center gap-2">
          {role === 'fan' ? (
            <>
              <div className="flex h-12 w-20 items-center justify-center overflow-hidden rounded-md border border-white/30 bg-[#155993] shadow-lg sm:w-24">
                <img
                  src="/upper-deck-header-logo.jpg"
                  alt="Upper Deck Seafood & Sports"
                  className="h-24 w-24 max-w-none object-cover object-center sm:h-28 sm:w-28"
                />
              </div>
              <span className="leading-tight">
                <span className="block text-xl font-black tracking-[0.04em] text-white">Upper Deck <span className="text-amber-300">Fan App</span></span>
                <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">Seafood & Sports World Cup Picks</span>
              </span>
            </>
          ) : (
            <>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-rose-400 to-emerald-300 text-sm font-black text-slate-950">
                GP
              </div>
              <span className="text-xl font-bold text-white">
                {brand.title.includes('Promo') ? 'Golazo' : brand.title.split(' ')[0]}
                <span className="text-amber-300">{brand.title.includes('Promo') ? 'Promo' : ` ${brand.title.split(' ').slice(1).join(' ')}`}</span>
              </span>
            </>
          )}
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={`rounded-md px-3 py-2 text-sm transition-colors ${role === 'fan' ? 'font-semibold text-slate-100 hover:bg-white/10 hover:text-amber-300' : 'text-slate-300 hover:bg-white/10 hover:text-amber-300'}`}>
              {link.label}
            </Link>
          ))}
        </nav>

        <select
          value={locale}
          onChange={(event) => setLocale(event.target.value as Locale)}
          className={`hidden h-10 rounded-md border px-3 text-sm font-bold outline-none lg:block ${role === 'fan' ? 'border-white/15 bg-white/10 text-white' : 'border-white/10 bg-white/10 text-white'}`}
          aria-label="Language"
        >
          {Object.entries(localeNames).map(([key, label]) => (
            <option key={key} value={key} className="bg-slate-950">{label}</option>
          ))}
        </select>

        <button onClick={() => setMenuOpen(!menuOpen)} className={`p-2 lg:hidden ${role === 'fan' ? 'text-white hover:text-amber-300' : 'text-slate-300 hover:text-white'}`} aria-label="Toggle menu">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <nav className={`border-t px-4 py-2 lg:hidden ${role === 'fan' ? 'upperdeck-app-header border-white/10' : 'border-white/10 bg-[#050914]'}`}>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className={`block px-3 py-2 text-sm transition-colors ${role === 'fan' ? 'font-semibold text-slate-100 hover:text-amber-300' : 'text-slate-300 hover:text-amber-300'}`}>
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
