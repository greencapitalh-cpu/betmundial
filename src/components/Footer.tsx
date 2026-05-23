'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, type Locale } from './LocaleProvider';

type FooterRole = 'portal' | 'fan' | 'merchant' | 'admin';

const footerCopy: Record<Locale, Record<FooterRole, { desc: string; title: string; links: Array<{ href: string; label: string }>; active: string }>> = {
  en: {
    portal: { desc: 'Choose the correct workspace before entering.', title: 'Access portal', active: 'Role selector active', links: [{ href: '/fan', label: 'Fan app' }, { href: '/merchant', label: 'Business console' }, { href: '/admin', label: 'Admin console' }] },
    fan: { desc: 'World fantasy bet with vouchers from nearby venues.', title: 'Fan flow', active: 'Fan app active', links: [{ href: '/fan#fixture', label: 'Fixture' }, { href: '/fan#predict', label: 'Predict' }, { href: '/fan#vouchers', label: 'Vouchers' }] },
    merchant: { desc: 'Merchant console for rewards, open promos and voucher validation.', title: 'Merchant flow', active: 'Verification active', links: [{ href: '/merchant#rewards', label: 'Rewards' }, { href: '/merchant#ads', label: 'Promos' }, { href: '/merchant#verify', label: 'Verify' }] },
    admin: { desc: 'Admin console for publishing and moderating local promotions.', title: 'Admin flow', active: 'Publishing active', links: [{ href: '/admin#publish', label: 'Publish' }, { href: '/admin#board', label: 'Board' }, { href: '/fan', label: 'Fan app' }] },
  },
  es: {
    portal: { desc: 'Elige el espacio correcto antes de entrar.', title: 'Portal de acceso', active: 'Selector de rol activo', links: [{ href: '/fan', label: 'App apostador' }, { href: '/merchant', label: 'Panel empresa' }, { href: '/admin', label: 'Panel admin' }] },
    fan: { desc: 'Prode mundialista con vales de locales cercanos.', title: 'Flujo usuario', active: 'App usuario activa', links: [{ href: '/fan#fixture', label: 'Fixture' }, { href: '/fan#predict', label: 'Pronosticar' }, { href: '/fan#vouchers', label: 'Vales' }] },
    merchant: { desc: 'Panel del local para premios, promos abiertas y validacion de vales.', title: 'Flujo local', active: 'Verificacion activa', links: [{ href: '/merchant#rewards', label: 'Premios' }, { href: '/merchant#ads', label: 'Promos' }, { href: '/merchant#verify', label: 'Verificar' }] },
    admin: { desc: 'Panel admin para publicar y moderar promociones de locales.', title: 'Flujo admin', active: 'Publicacion activa', links: [{ href: '/admin#publish', label: 'Publicar' }, { href: '/admin#board', label: 'Tablero' }, { href: '/fan', label: 'App usuario' }] },
  },
  pt: {
    portal: { desc: 'Escolha o espaco correto antes de entrar.', title: 'Portal de acesso', active: 'Seletor de papel ativo', links: [{ href: '/fan', label: 'App apostador' }, { href: '/merchant', label: 'Painel empresa' }, { href: '/admin', label: 'Painel admin' }] },
    fan: { desc: 'Fantasy bet mundial com cupons de locais proximos.', title: 'Fluxo usuario', active: 'App usuario ativo', links: [{ href: '/fan#fixture', label: 'Tabela' }, { href: '/fan#predict', label: 'Apostar' }, { href: '/fan#vouchers', label: 'Cupons' }] },
    merchant: { desc: 'Console do local para premios, promos e validacao de cupons.', title: 'Fluxo local', active: 'Verificacao ativa', links: [{ href: '/merchant#rewards', label: 'Premios' }, { href: '/merchant#ads', label: 'Promos' }, { href: '/merchant#verify', label: 'Verificar' }] },
    admin: { desc: 'Console admin para publicar e moderar promocoes.', title: 'Fluxo admin', active: 'Publicacao ativa', links: [{ href: '/admin#publish', label: 'Publicar' }, { href: '/admin#board', label: 'Painel' }, { href: '/fan', label: 'App usuario' }] },
  },
  fr: {
    portal: { desc: 'Choisissez le bon espace avant d entrer.', title: 'Portail d acces', active: 'Selecteur de role actif', links: [{ href: '/fan', label: 'App fan' }, { href: '/merchant', label: 'Console commerce' }, { href: '/admin', label: 'Console admin' }] },
    fan: { desc: 'Fantasy bet mondial avec coupons de lieux proches.', title: 'Flux fan', active: 'App fan active', links: [{ href: '/fan#fixture', label: 'Calendrier' }, { href: '/fan#predict', label: 'Pronostiquer' }, { href: '/fan#vouchers', label: 'Coupons' }] },
    merchant: { desc: 'Console commerce pour prix, promos et validation des coupons.', title: 'Flux commerce', active: 'Verification active', links: [{ href: '/merchant#rewards', label: 'Prix' }, { href: '/merchant#ads', label: 'Promos' }, { href: '/merchant#verify', label: 'Verifier' }] },
    admin: { desc: 'Console admin pour publier et moderer les promotions.', title: 'Flux admin', active: 'Publication active', links: [{ href: '/admin#publish', label: 'Publier' }, { href: '/admin#board', label: 'Tableau' }, { href: '/fan', label: 'App fan' }] },
  },
};

export default function Footer() {
  const { locale } = useLocale();
  const pathname = usePathname();
  const role: FooterRole = pathname.startsWith('/merchant') ? 'merchant' : pathname.startsWith('/admin') ? 'admin' : pathname.startsWith('/fan') ? 'fan' : 'portal';
  const t = footerCopy[locale][role];

  return (
    <footer className="mt-auto border-t border-white/10 bg-[#050914]">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-rose-400 to-emerald-300 text-xs font-black text-slate-950">GP</div>
              <span className="font-bold text-white">{t.title}</span>
            </div>
            <p className="max-w-xl text-sm text-[#8b95a6]">{t.desc}</p>
          </div>
          <div className="flex flex-wrap items-start gap-3 md:justify-end">
            {t.links.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-md border border-white/10 px-3 py-2 text-sm text-[#8b95a6] hover:text-amber-300">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 md:flex-row">
          <p className="text-sm text-[#8b95a6]">&copy; 2026 GolazoPromo.</p>
          <div className="flex items-center gap-2 text-sm text-[#8b95a6]">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-300 animate-pulse-live" />
            {t.active}
          </div>
        </div>
      </div>
    </footer>
  );
}
