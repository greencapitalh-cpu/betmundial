'use client';

import { useLocale, type Locale } from './LocaleProvider';

const footerCopy: Record<Locale, { description: string; disclaimers: string[] }> = {
  en: {
    description: 'A P2P conditional escrow technology demo powered by UDoChain. The World Cup is the first verifiable use case.',
    disclaimers: ['No real money.', 'EscrowCoins are virtual credits.', 'Technology demo for conditional escrow.', 'UDoChain does not operate betting or gambling.'],
  },
  es: {
    description: 'Una demo tecnológica de escrow condicional P2P impulsada por UDoChain. El Mundial es el primer caso de uso verificable.',
    disclaimers: ['No utiliza dinero real.', 'Los EscrowCoins son créditos virtuales.', 'Demo tecnológica de escrow condicional.', 'UDoChain no opera apuestas ni juegos de azar.'],
  },
  pt: {
    description: 'Uma demo tecnológica de escrow condicional P2P desenvolvida pela UDoChain. A Copa é o primeiro caso de uso verificável.',
    disclaimers: ['Não utiliza dinheiro real.', 'EscrowCoins são créditos virtuais.', 'Demo tecnológica de escrow condicional.', 'A UDoChain não opera apostas nem jogos de azar.'],
  },
  fr: {
    description: 'Une démo technologique d’escrow conditionnel P2P propulsée par UDoChain. La Coupe du Monde est le premier cas d’usage vérifiable.',
    disclaimers: ['Aucun argent réel.', 'Les EscrowCoins sont des crédits virtuels.', 'Démo technologique d’escrow conditionnel.', 'UDoChain n’opère ni paris ni jeux d’argent.'],
  },
};

export default function Footer() {
  const { locale } = useLocale();
  const t = footerCopy[locale];
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#030914]">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row">
          <div>
            <p className="font-black text-white">EscrowBet.cool</p>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-400">{t.description}</p>
          </div>
          <ul className="grid gap-1 text-xs text-slate-400 sm:grid-cols-2">
            {t.disclaimers.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>
      </div>
    </footer>
  );
}
