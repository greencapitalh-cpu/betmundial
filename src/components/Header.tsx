'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { localeNames, useLocale, type Locale } from './LocaleProvider';

type NavRole = 'fan' | 'merchant' | 'admin';

const roleBrand: Record<NavRole, { title: string; home: string }> = {
  fan: { title: 'GolazoPromo', home: '/' },
  merchant: { title: 'Local Console', home: '/merchant' },
  admin: { title: 'Admin Console', home: '/admin' },
};

const navCopy: Record<Locale, Record<NavRole, Array<{ href: string; label: string }>>> = {
  en: {
    fan: [
      { href: '/#fixture', label: 'Fixture' },
      { href: '/#predict', label: 'Predict' },
      { href: '/#vouchers', label: 'My vouchers' },
      { href: '/#promos', label: 'Promos' },
    ],
    merchant: [
      { href: '/merchant#rewards', label: 'Rewards' },
      { href: '/merchant#ads', label: 'Promos' },
      { href: '/merchant#verify', label: 'Verify QR' },
    ],
    admin: [
      { href: '/admin#publish', label: 'Publish' },
      { href: '/admin#board', label: 'Board' },
      { href: '/', label: 'Fan app' },
    ],
  },
  es: {
    fan: [
      { href: '/#fixture', label: 'Fixture' },
      { href: '/#predict', label: 'Pronosticar' },
      { href: '/#vouchers', label: 'Mis vales' },
      { href: '/#promos', label: 'Promos' },
    ],
    merchant: [
      { href: '/merchant#rewards', label: 'Premios' },
      { href: '/merchant#ads', label: 'Promos' },
      { href: '/merchant#verify', label: 'Verificar QR' },
    ],
    admin: [
      { href: '/admin#publish', label: 'Publicar' },
      { href: '/admin#board', label: 'Tablero' },
      { href: '/', label: 'App usuario' },
    ],
  },
  pt: {
    fan: [
      { href: '/#fixture', label: 'Tabela' },
      { href: '/#predict', label: 'Apostar' },
      { href: '/#vouchers', label: 'Meus cupons' },
      { href: '/#promos', label: 'Promos' },
    ],
    merchant: [
      { href: '/merchant#rewards', label: 'Premios' },
      { href: '/merchant#ads', label: 'Promos' },
      { href: '/merchant#verify', label: 'Verificar QR' },
    ],
    admin: [
      { href: '/admin#publish', label: 'Publicar' },
      { href: '/admin#board', label: 'Painel' },
      { href: '/', label: 'App usuario' },
    ],
  },
  fr: {
    fan: [
      { href: '/#fixture', label: 'Calendrier' },
      { href: '/#predict', label: 'Pronostiquer' },
      { href: '/#vouchers', label: 'Mes coupons' },
      { href: '/#promos', label: 'Promos' },
    ],
    merchant: [
      { href: '/merchant#rewards', label: 'Prix' },
      { href: '/merchant#ads', label: 'Promos' },
      { href: '/merchant#verify', label: 'Verifier QR' },
    ],
    admin: [
      { href: '/admin#publish', label: 'Publier' },
      { href: '/admin#board', label: 'Tableau' },
      { href: '/', label: 'App fan' },
    ],
  },
};

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { locale, setLocale } = useLocale();
  const pathname = usePathname();
  const role: NavRole = pathname.startsWith('/merchant') ? 'merchant' : pathname.startsWith('/admin') ? 'admin' : 'fan';
  const brand = roleBrand[role];
  const navLinks = navCopy[locale][role];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050914]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href={brand.home} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-rose-400 to-emerald-300 text-sm font-black text-slate-950">
            GP
          </div>
          <span className="text-xl font-bold text-white">
            {brand.title.includes('Promo') ? 'Golazo' : brand.title.split(' ')[0]}
            <span className="text-amber-300">{brand.title.includes('Promo') ? 'Promo' : ` ${brand.title.split(' ').slice(1).join(' ')}`}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-md px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/10 hover:text-amber-300">
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

        <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-slate-300 hover:text-white lg:hidden" aria-label="Toggle menu">
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
        <nav className="border-t border-white/10 bg-[#050914] px-4 py-2 lg:hidden">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-300 transition-colors hover:text-amber-300">
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
