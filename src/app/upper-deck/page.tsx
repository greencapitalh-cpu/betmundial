import Link from 'next/link';

const promos = [
  {
    title: 'Score Prediction Reward',
    prize: 'Free appetizer for exact score winners',
    detail: 'Fans predict the final score before kickoff and receive a QR voucher if they hit.',
  },
  {
    title: 'Watch Party Check-in',
    prize: '$2 off appetizers during live games',
    detail: 'A simple visit promo for guests already inside the bar, no prediction required.',
  },
  {
    title: 'Seafood Match Night',
    prize: 'Oyster shooter bonus with qualifying entree',
    detail: 'Campaign can run by city, match, time window, or selected sports event.',
  },
];

const matchCards = [
  { tag: 'World Cup', game: 'USA vs England', time: '8:00 PM Miami time', line: 'Predict exact score' },
  { tag: 'NFL', game: 'Dolphins game night', time: 'Sunday live', line: 'Winner pick reward' },
  { tag: 'UFC', game: 'Main card watch party', time: 'Saturday late night', line: 'Check-in voucher' },
];

export default function UpperDeckDemoPage() {
  return (
    <main className="min-h-screen bg-[#061620] text-white">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src="/upper-deck-photo.jpg"
            alt="Upper Deck Seafood and Sports sign"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,12,18,0.96)_0%,rgba(3,12,18,0.78)_44%,rgba(3,12,18,0.34)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,12,18,0.1)_0%,rgba(3,12,18,0.94)_96%)]" />
        </div>

        <div className="mx-auto grid min-h-[88vh] max-w-7xl items-center gap-10 px-4 py-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-8 flex items-center gap-4">
              <img
                src="/upper-deck-goalpromo-logo.svg"
                alt="Upper Deck GoalPromo venue pilot logo"
                className="h-20 w-20 rounded-2xl border border-[#f6d36b]/35 bg-[#071d2b] object-contain p-2 shadow-xl"
              />
              <div>
                <p className="text-sm font-black uppercase tracking-[0.28em] text-[#63d6c8]">GoalPromo venue demo</p>
                <p className="mt-1 text-sm font-bold text-[#f6d36b]">Seafood, sports and QR rewards</p>
              </div>
            </div>
            <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[1.02] md:text-7xl">
              Upper Deck game-night rewards.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
              A branded prediction and coupon flow for Upper Deck Ale & Sports Grille in Hallandale Beach:
              fans pick scores, receive QR vouchers, and discover seafood and sports-bar promos before and during live games.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="https://upperdeckhallandalebeach.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-md bg-[#f6d36b] px-5 py-3 text-sm font-black text-[#061620] transition hover:bg-white"
              >
                Venue website
              </a>
              <Link
                href="/fan"
                className="rounded-md border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:border-[#63d6c8] hover:text-[#63d6c8]"
              >
                Open fan flow
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-white/15 bg-[#071d2b]/86 p-4 shadow-2xl backdrop-blur">
            <div className="rounded-md border border-[#63d6c8]/30 bg-[#082536] p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src="/upper-deck-goalpromo-logo.svg"
                    alt=""
                    className="h-16 w-16 rounded-xl border border-[#f6d36b]/30 bg-[#071d2b] object-contain p-2"
                  />
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#63d6c8]">Live venue profile</p>
                    <h2 className="mt-2 text-2xl font-black">Upper Deck Ale & Sports Grille</h2>
                  </div>
                </div>
                <span className="rounded-full bg-[#f6d36b] px-3 py-1 text-xs font-black text-[#061620]">Hallandale</span>
              </div>
              <dl className="mt-5 grid gap-3 text-sm text-slate-200">
                <div className="rounded-md bg-white/8 p-3">
                  <dt className="font-black text-white">Address</dt>
                  <dd>906 E Hallandale Beach Blvd, Hallandale Beach, FL 33009</dd>
                </div>
                <div className="rounded-md bg-white/8 p-3">
                  <dt className="font-black text-white">Phone</dt>
                  <dd>(954) 454-8878</dd>
                </div>
                <div className="rounded-md bg-white/8 p-3">
                  <dt className="font-black text-white">Positioning</dt>
                  <dd>Seafood, sports bar, outdoor deck, TVs, live games, UFC, NFL, NBA, MLB and event nights.</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#031017] py-3">
        <div className="mx-auto max-w-7xl overflow-hidden px-4">
          <div className="flex min-w-max gap-3">
            {[...promos, ...promos].map((promo, index) => (
              <div key={`${promo.title}-${index}`} className="w-[310px] rounded-md border border-white/10 bg-white/8 p-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f6d36b]">{promo.title}</p>
                <p className="mt-1 truncate text-sm font-black text-white">{promo.prize}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg border border-white/10 bg-white/8 p-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#63d6c8]">Fan experience</p>
          <h2 className="mt-3 text-3xl font-black">Predict, watch, redeem.</h2>
          <div className="mt-5 grid gap-3">
            {matchCards.map((match) => (
              <button key={match.game} className="grid rounded-md border border-white/10 bg-[#082536] p-4 text-left transition hover:border-[#f6d36b] md:grid-cols-[0.7fr_1fr_auto] md:items-center">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-[#63d6c8]">{match.tag}</span>
                <span>
                  <strong className="block text-lg text-white">{match.game}</strong>
                  <span className="text-sm text-slate-300">{match.time}</span>
                </span>
                <span className="mt-3 rounded-md bg-white/10 px-3 py-2 text-xs font-black text-[#f6d36b] md:mt-0">{match.line}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-[#071d2b] p-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f6d36b]">Merchant console preview</p>
          <h2 className="mt-3 text-3xl font-black">Campaigns Upper Deck can publish.</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {promos.map((promo) => (
              <article key={promo.title} className="rounded-md border border-white/10 bg-white/8 p-4">
                <p className="text-sm font-black text-[#63d6c8]">{promo.title}</p>
                <h3 className="mt-2 text-xl font-black">{promo.prize}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{promo.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-12 lg:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-white/8 p-5">
          <img src="/upper-deck-goalpromo-logo.svg" alt="" className="mb-4 h-14 w-14 rounded-lg bg-[#071d2b] p-2" />
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#63d6c8]">Voucher logic</p>
          <h2 className="mt-3 text-2xl font-black">QR prize verification</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Staff scan the fan QR, verify authenticity, check reward conditions, and mark the voucher as redeemed.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/8 p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#f6d36b]">Local targeting</p>
          <h2 className="mt-3 text-2xl font-black">Hallandale and Miami area campaigns</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Promotions can be filtered by city, event type, match schedule, and nearby fans looking for a place to watch.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/8 p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#63d6c8]">Next sales step</p>
          <h2 className="mt-3 text-2xl font-black">Offer a pilot week</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Start with one watch-party promo, one exact-score reward, and one check-in offer during a high-traffic game.
          </p>
        </div>
      </section>
    </main>
  );
}
