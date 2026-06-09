const DISCLAIMERS = [
  'No real money.',
  'EscrowCoins are virtual credits.',
  'This is a technology demo for conditional escrow.',
  'UDoChain does not operate betting or gambling.',
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#030914]">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row">
          <div>
            <p className="font-black text-white">EscrowBet.cool</p>
            <p className="mt-1 text-sm text-slate-400">World Cup Edition · Conditional escrow technology demo powered by UDoChain</p>
          </div>
          <ul className="grid gap-1 text-xs text-slate-400 sm:grid-cols-2">
            {DISCLAIMERS.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>
      </div>
    </footer>
  );
}
