'use client';

import Link from 'next/link';
import { useLocale, type Locale } from '@/components/LocaleProvider';

const copy: Record<Locale, {
  kicker: string;
  title: string;
  body: string;
  access: string;
  fan: string;
  fanText: string;
  merchant: string;
  merchantText: string;
  admin: string;
  adminText: string;
}> = {
  en: {
    kicker: 'GolazoPromo access',
    title: 'Choose your World Cup flow.',
    body: 'Fan predictions, merchant rewards, and admin publishing are separated so each user enters only the workspace they need.',
    access: 'Enter',
    fan: 'Fan app',
    fanText: 'Predict fixtures, save your picks, and claim vouchers when you win.',
    merchant: 'Business console',
    merchantText: 'Create rewards, publish visit promos, and validate voucher QR codes.',
    admin: 'Admin console',
    adminText: 'Publish and review local promotions before they appear in the fan app.',
  },
  es: {
    kicker: 'Acceso GolazoPromo',
    title: 'Elige tu flujo mundialista.',
    body: 'Pronosticos de usuarios, premios de locales y publicacion admin quedan separados para que cada persona entre solo a su espacio.',
    access: 'Entrar',
    fan: 'App apostador',
    fanText: 'Ve el fixture, guarda predicciones y reclama vales cuando aciertas.',
    merchant: 'Panel empresa',
    merchantText: 'Crea premios, publica promos por visita y valida codigos QR.',
    admin: 'Panel admin',
    adminText: 'Publica y revisa promociones de locales antes de mostrarlas al usuario.',
  },
  pt: {
    kicker: 'Acesso GolazoPromo',
    title: 'Escolha seu fluxo mundial.',
    body: 'Apostas dos usuarios, premios de locais e publicacao admin ficam separados para cada pessoa entrar no espaco certo.',
    access: 'Entrar',
    fan: 'App apostador',
    fanText: 'Veja a tabela, salve palpites e resgate cupons quando acertar.',
    merchant: 'Painel empresa',
    merchantText: 'Crie premios, publique promos por visita e valide QR codes.',
    admin: 'Painel admin',
    adminText: 'Publique e revise promocoes de locais antes de aparecerem no app.',
  },
  fr: {
    kicker: 'Acces GolazoPromo',
    title: 'Choisissez votre flux mondial.',
    body: 'Pronostics fan, recompenses commerce et publication admin sont separes pour que chaque role entre dans son propre espace.',
    access: 'Entrer',
    fan: 'App pronostiqueur',
    fanText: 'Consultez le calendrier, sauvegardez vos pronostics et reclamez vos coupons.',
    merchant: 'Console commerce',
    merchantText: 'Creez des prix, publiez des promos et validez les QR codes.',
    admin: 'Console admin',
    adminText: 'Publiez et verifiez les promotions avant leur affichage dans l app.',
  },
};

const cards = [
  { key: 'fan', href: '/fan', tone: 'from-amber-300 via-rose-400 to-emerald-300' },
  { key: 'merchant', href: '/merchant', tone: 'from-emerald-300 via-cyan-300 to-amber-300' },
  { key: 'admin', href: '/admin', tone: 'from-sky-300 via-violet-300 to-amber-300' },
] as const;

export default function PortalPage() {
  const { locale } = useLocale();
  const t = copy[locale];

  return (
    <div className="stadium-surface min-h-screen text-white">
      <section className="world-hero-bg border-b border-white/10">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:min-h-[calc(100vh-73px)] lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:py-20">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-amber-300">{t.kicker}</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight md:text-6xl">{t.title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">{t.body}</p>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              <Stat value="104" label="matches" />
              <Stat value="3" label="frontends" />
              <Stat value="QR" label="vouchers" />
            </div>
          </div>

          <div className="grid gap-4">
            {cards.map((card) => (
              <Link key={card.key} href={card.href} className="promo-ticket role-card group block rounded-lg p-1 transition hover:border-amber-300/70">
                <div className={`h-2 rounded-t-md bg-gradient-to-r ${card.tone}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black">{t[card.key]}</h2>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">{t[`${card.key}Text`]}</p>
                    </div>
                    <span className="rounded-md bg-white px-4 py-2 text-sm font-black text-slate-950 transition group-hover:bg-amber-300">{t.access}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/10 p-3">
      <strong className="block text-2xl font-black text-amber-300">{value}</strong>
      <span className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</span>
    </div>
  );
}
