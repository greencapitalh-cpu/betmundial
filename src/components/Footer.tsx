'use client';

import Link from 'next/link';
import { useLocale, type Locale } from './LocaleProvider';

const footerCopy: Record<Locale, { desc: string; ops: string; shops: string; demo: string; rights: string; active: string }> = {
  en: { desc: 'World fantasy bet with a coupon engine for clubs, bars, and shops near every host zone.', ops: 'Operations', shops: 'Businesses', demo: 'Demo', rights: 'World Cup-style bets and local commerce.', active: 'Coupon engine active' },
  es: { desc: 'Prode mundialista con motor de cupones para boliches, bares y comercios cerca de cada sede.', ops: 'Operacion', shops: 'Comercios', demo: 'Demo', rights: 'Mundial, apuestas y comercios locales.', active: 'Motor de cupones activo' },
  pt: { desc: 'Fantasy bet mundial com motor de cupons para baladas, bares e lojas perto de cada sede.', ops: 'Operação', shops: 'Comércios', demo: 'Demo', rights: 'Mundial, apostas e comércio local.', active: 'Motor de cupons ativo' },
  fr: { desc: 'Fantasy bet mondial avec moteur de coupons pour clubs, bars et commerces près de chaque site.', ops: 'Opération', shops: 'Commerces', demo: 'Démo', rights: 'Mondial, paris et commerce local.', active: 'Moteur de coupons actif' },
};

export default function Footer() {
  const { locale } = useLocale();
  const t = footerCopy[locale];

  return (
    <footer className="mt-auto border-t border-white/10 bg-[#050914]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-300 via-rose-400 to-emerald-300 flex items-center justify-center text-slate-950 font-black text-xs">
                GP
              </div>
              <span className="font-bold text-white">GolazoPromo</span>
            </div>
            <p className="text-sm text-[#6b7280]">
              {t.desc}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">{t.ops}</h4>
            <div className="space-y-2">
              <Link href="/#fixture" className="block text-sm text-[#6b7280] hover:text-amber-300">Fixture</Link>
              <Link href="/#apuestas" className="block text-sm text-[#6b7280] hover:text-amber-300">Apuestas</Link>
              <Link href="/#cupones" className="block text-sm text-[#6b7280] hover:text-amber-300">Cupones</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">{t.shops}</h4>
            <div className="space-y-2">
              <Link href="/#cupones" className="block text-sm text-[#6b7280] hover:text-amber-300">Auspicios</Link>
              <Link href="/#cupones" className="block text-sm text-[#6b7280] hover:text-amber-300">Promos 2x1</Link>
              <Link href="/#cupones" className="block text-sm text-[#6b7280] hover:text-amber-300">Links a locales</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">{t.demo}</h4>
            <div className="space-y-2">
              <Link href="/live" className="block text-sm text-[#6b7280] hover:text-amber-300">Live</Link>
              <Link href="/scores" className="block text-sm text-[#6b7280] hover:text-amber-300">Marcadores</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[#6b7280]">&copy; 2026 GolazoPromo. {t.rights}</p>
          <div className="flex items-center gap-2 text-sm text-[#6b7280]">
            <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse-live inline-block"></span>
            {t.active}
          </div>
        </div>
      </div>
    </footer>
  );
}
