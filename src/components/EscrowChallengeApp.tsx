'use client';

import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import Image from 'next/image';
import OnChainWalletPanel from './OnChainWalletPanel';
import {
  ArrowRight, CalendarDays, CheckCircle2, ChevronRight, CircleDollarSign,
  Clock3, FileCheck2, LockKeyhole, MapPin, QrCode, Search, Share2,
  ShieldCheck, Trophy, UserRound, WalletCards, X,
} from 'lucide-react';
import { useLocale, type Locale } from './LocaleProvider';
import { clearAccount, readAccount, saveAccount, type Account } from '@/lib/account';

type Match = {
  matchId: string; stage?: string; groupCode?: string; homeTeam: string; awayTeam: string;
  kickoffUtc?: string; stadium?: string; city?: string; status?: string;
  homeScore?: number | null; awayScore?: number | null;
};
type Prediction = { homeScore: number; awayScore: number };
type Party = { email: string; prediction: Prediction; accountId: string };
type Agreement = {
  challengeId: string; match: Match; creator: Party; opponent?: Party;
  stakePerPlayer: number; pot: number; status: string;
  settlement?: { outcome?: string; receiptHash?: string };
};
type Wallet = { available: number; locked: number; total: number };
type Leader = { _id: string; wins: number; escrowCoinsWon: number };

const API_URL = (process.env.NEXT_PUBLIC_UDOCHAIN_API_URL || 'https://api.udochain.com').replace(/\/$/, '');
const BET_API_URL = (process.env.NEXT_PUBLIC_BET_API_URL || 'https://bet2back-production.up.railway.app').replace(/\/$/, '');
const DISCLAIMERS = [
  'No real money.',
  'EscrowCoins are virtual credits.',
  'This is a technology demo for conditional escrow.',
  'UDoChain does not operate betting or gambling.',
];

const copy: Record<Locale, Record<string, string>> = {
  en: {
    welcome: 'Welcome', available: 'Available', locked: 'Locked', total: 'Total',
    matches: 'World Cup matches', filter: 'Search team, group, city or stage',
    signIn: 'Sign in', register: 'Create account', logout: 'Log out', email: 'Email', password: 'Password',
    prediction: 'Your prediction', stake: 'EscrowCoins per player', publish: 'Publish P2P agreement',
    open: 'Open challenges', mine: 'My agreements', accept: 'Accept challenge',
    settle: 'Verify result and settle', leaderboard: 'Leaderboard', receipt: 'Receipt',
    empty: 'Nothing here yet.', loginRequired: 'Sign in to continue.',
  },
  es: {
    welcome: 'Bienvenido', available: 'Disponible', locked: 'Bloqueado', total: 'Total',
    matches: 'Partidos del Mundial', filter: 'Buscar equipo, grupo, ciudad o fase',
    signIn: 'Ingresar', register: 'Crear cuenta', logout: 'Salir', email: 'Email', password: 'Contrasena',
    prediction: 'Tu pronostico', stake: 'EscrowCoins por jugador', publish: 'Publicar acuerdo P2P',
    open: 'Challenges abiertos', mine: 'Mis acuerdos', accept: 'Aceptar challenge',
    settle: 'Verificar resultado y liquidar', leaderboard: 'Ranking', receipt: 'Receipt',
    empty: 'Todavia no hay elementos.', loginRequired: 'Ingresa para continuar.',
  },
  pt: {
    welcome: 'Bem-vindo', available: 'Disponivel', locked: 'Bloqueado', total: 'Total',
    matches: 'Jogos da Copa', filter: 'Buscar equipe, grupo, cidade ou fase',
    signIn: 'Entrar', register: 'Criar conta', logout: 'Sair', email: 'Email', password: 'Senha',
    prediction: 'Seu palpite', stake: 'EscrowCoins por jogador', publish: 'Publicar acordo P2P',
    open: 'Challenges abertos', mine: 'Meus acordos', accept: 'Aceitar challenge',
    settle: 'Verificar resultado e liquidar', leaderboard: 'Ranking', receipt: 'Receipt',
    empty: 'Ainda nao ha itens.', loginRequired: 'Entre para continuar.',
  },
  fr: {
    welcome: 'Bienvenue', available: 'Disponible', locked: 'Bloque', total: 'Total',
    matches: 'Matchs de la Coupe', filter: 'Rechercher equipe, groupe, ville ou phase',
    signIn: 'Connexion', register: 'Creer un compte', logout: 'Deconnexion', email: 'Email', password: 'Mot de passe',
    prediction: 'Votre pronostic', stake: 'EscrowCoins par joueur', publish: 'Publier accord P2P',
    open: 'Challenges ouverts', mine: 'Mes accords', accept: 'Accepter le challenge',
    settle: 'Verifier et regler', leaderboard: 'Classement', receipt: 'Receipt',
    empty: 'Aucun element pour le moment.', loginRequired: 'Connectez-vous pour continuer.',
  },
};

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data as T;
}

function normalizeBetMatch(match: Record<string, unknown>): Match {
  return {
    matchId: String(match.id ?? match.match_id ?? match.matchId ?? ''),
    stage: String(match.stage ?? match.phase ?? match.round ?? ''),
    groupCode: String(match.group_code ?? match.group ?? match.groupCode ?? ''),
    homeTeam: String(match.home_team ?? match.homeTeam ?? match.team_home ?? 'TBD'),
    awayTeam: String(match.away_team ?? match.awayTeam ?? match.team_away ?? 'TBD'),
    kickoffUtc: String(match.kickoff_utc ?? match.kickoffUtc ?? match.match_date ?? ''),
    stadium: String(match.stadium ?? match.venue ?? ''),
    city: String(match.city ?? match.host_city ?? ''),
    status: String(match.status ?? 'scheduled'),
    homeScore: match.home_score == null ? null : Number(match.home_score),
    awayScore: match.away_score == null ? null : Number(match.away_score),
  };
}

export default function EscrowChallengeApp() {
  const { locale } = useLocale();
  const t = copy[locale];
  const [account, setAccount] = useState<Account | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [openAgreements, setOpenAgreements] = useState<Agreement[]>([]);
  const [myAgreements, setMyAgreements] = useState<Agreement[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [selected, setSelected] = useState<Match | null>(null);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authOpen, setAuthOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [sharedAgreement, setSharedAgreement] = useState<Agreement | null>(null);

  const loadPublic = useCallback(async () => {
    try {
      const data = await request<{ matches: Match[] }>('/api/escrow-challenges/matches');
      setMatches(data.matches);
    } catch {
      const response = await fetch(`${BET_API_URL}/api/matches`);
      if (!response.ok) throw new Error('The World Cup fixture is temporarily unavailable');
      const payload = await response.json();
      const source = Array.isArray(payload) ? payload : payload.matches || payload.data || [];
      setMatches(source.map(normalizeBetMatch));
    }
    request<{ leaderboard: Leader[] }>('/api/escrow-challenges/leaderboard')
      .then((data) => setLeaders(data.leaderboard)).catch(() => setLeaders([]));
  }, []);

  const loadPrivate = useCallback(async (session: Account) => {
    const [walletData, openData, mineData] = await Promise.all([
      request<{ wallet: Wallet }>('/api/escrow-challenges/wallet', {}, session.token),
      request<{ agreements: Agreement[] }>('/api/escrow-challenges/agreements/open', {}, session.token),
      request<{ agreements: Agreement[] }>('/api/escrow-challenges/agreements/me', {}, session.token),
    ]);
    setWallet(walletData.wallet);
    setOpenAgreements(openData.agreements);
    setMyAgreements(mineData.agreements);
  }, []);

  useEffect(() => {
    const saved = readAccount();
    setAccount(saved);
    loadPublic().catch((error) => setNotice(error.message));
    if (saved) loadPrivate(saved).catch(() => { clearAccount(); setAccount(null); });
    const challengeId = new URLSearchParams(window.location.search).get('challenge');
    if (challengeId) {
      request<{ agreement: Agreement }>(`/api/escrow-challenges/agreements/${encodeURIComponent(challengeId)}/public`)
        .then((data) => setSharedAgreement(data.agreement)).catch((error) => setNotice(error.message));
    }
    QRCode.toDataURL(window.location.origin, {
      width: 320, margin: 2, color: { dark: '#06101d', light: '#ffffff' },
    }).then(setQrDataUrl).catch(() => undefined);
  }, [loadPrivate, loadPublic]);

  const filteredMatches = useMemo(() => {
    const value = search.trim().toLowerCase();
    return matches.filter((match) =>
      (stageFilter === 'all' || matchStageKey(match) === stageFilter) &&
      (!value || [match.homeTeam, match.awayTeam, match.groupCode, match.stage, match.city, match.stadium]
        .filter(Boolean).join(' ').toLowerCase().includes(value))
    );
  }, [matches, search, stageFilter]);

  const featuredMatch = filteredMatches[0] || matches[0] || null;

  function requireAuth(action?: () => void) {
    if (!account) {
      setNotice(t.loginRequired);
      setAuthOpen(true);
      return;
    }
    action?.();
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '');
    const password = String(form.get('password') || '');
    setBusy(true);
    setNotice('');
    try {
      if (authMode === 'register') {
        await request('/api/auth/register', {
          method: 'POST', body: JSON.stringify({ email, password, source: 'escrow-challenge' }),
        });
        setNotice('Account created. Verify your email, then sign in.');
        setAuthMode('login');
      } else {
        const data = await request<{ token: string; user: { id: string; email: string; username?: string } }>(
          '/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }
        );
        const session = { ...data.user, token: data.token };
        saveAccount(session);
        setAccount(session);
        setAuthOpen(false);
        await loadPrivate(session);
        setNotice(`${t.welcome}, ${session.email}`);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  }

  async function createAgreement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account || !selected) return requireAuth();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await request('/api/escrow-challenges/agreements', {
        method: 'POST',
        body: JSON.stringify({
          matchId: selected.matchId,
          stake: Number(form.get('stake')),
          prediction: { homeScore: Number(form.get('homeScore')), awayScore: Number(form.get('awayScore')) },
        }),
      }, account.token);
      setSelected(null);
      await loadPrivate(account);
      setNotice('P2P agreement published.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not create agreement');
    } finally {
      setBusy(false);
    }
  }

  async function acceptAgreement(event: FormEvent<HTMLFormElement>, agreement: Agreement) {
    event.preventDefault();
    if (!account) return requireAuth();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await request(`/api/escrow-challenges/agreements/${agreement.challengeId}/accept`, {
        method: 'POST',
        body: JSON.stringify({
          prediction: { homeScore: Number(form.get('homeScore')), awayScore: Number(form.get('awayScore')) },
        }),
      }, account.token);
      await loadPrivate(account);
      setNotice('Agreement accepted. EscrowCoins are now locked.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not accept agreement');
    } finally {
      setBusy(false);
    }
  }

  async function settle(agreement: Agreement) {
    if (!account) return requireAuth();
    setBusy(true);
    try {
      await request(`/api/escrow-challenges/agreements/${agreement.challengeId}/settle`, { method: 'POST' }, account.token);
      await Promise.all([loadPrivate(account), loadPublic()]);
      setNotice('Verified result settled. Receipt and evidence created.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Result is not ready');
    } finally {
      setBusy(false);
    }
  }

  async function shareAgreement(agreement: Agreement) {
    const url = `${window.location.origin}/?challenge=${encodeURIComponent(agreement.challengeId)}`;
    if (navigator.share) {
      await navigator.share({
        title: `${agreement.match.homeTeam} vs ${agreement.match.awayTeam}`,
        text: `Accept my EscrowBet.cool challenge for ${agreement.stakePerPlayer} EscrowCoins.`,
        url,
      }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url);
    setNotice('Challenge link copied.');
  }

  return (
    <div className="escrow-surface min-h-screen">
      <section className="sports-hero">
        <div className="mx-auto max-w-7xl px-4 py-5 md:py-8">
          <div className="hero-account-bar">
            <div className="flex min-w-0 items-center gap-3">
              <div className="user-orb"><UserRound size={19} /></div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">
                  {account ? `${t.welcome}, ${account.email}` : 'EscrowBet.cool World Cup'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {account ? 'Verified UDoChain session' : 'Create challenges with virtual credits'}
                </p>
              </div>
            </div>
            <div className="hero-balance"><span>{t.available}</span><strong>{wallet?.available ?? 1000} <small>EC</small></strong></div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.28fr_.72fr]">
            <div className="featured-market">
              <div className="featured-overlay">
                <div className="flex items-center justify-between gap-3">
                  <span className="live-badge"><span /> World Cup 2026</span>
                  <span className="protocol-badge"><ShieldCheck size={13} /> Conditional escrow</span>
                </div>
                {featuredMatch ? (
                  <>
                    <div className="featured-kickoff">
                      <CalendarDays size={14} />{formatKickoff(featuredMatch.kickoffUtc, locale)}
                      {featuredMatch.city && <><span>·</span><MapPin size={14} />{featuredMatch.city}</>}
                    </div>
                    <div className="featured-teams">
                      <TeamCrest name={featuredMatch.homeTeam} />
                      <div className="featured-versus">
                        <span>{featuredMatch.groupCode ? `GROUP ${featuredMatch.groupCode}` : featuredMatch.stage || 'MATCH'}</span>
                        <strong>VS</strong>
                      </div>
                      <TeamCrest name={featuredMatch.awayTeam} />
                    </div>
                    <button onClick={() => requireAuth(() => setSelected(featuredMatch))} className="hero-cta">
                      Create challenge <ArrowRight size={18} />
                    </button>
                  </>
                ) : <div className="py-14 text-center text-sm text-slate-400">Loading the World Cup fixture...</div>}
              </div>
            </div>

            <div className="quick-panel">
              <div>
                <p className="section-kicker">How it works</p>
                <h1 className="mt-2 text-2xl font-black leading-tight text-white md:text-3xl">Predict. Lock. Verify. Settle.</h1>
                <p className="mt-3 text-sm leading-6 text-slate-400">A P2P technology demo backed by match evidence and verifiable receipts.</p>
              </div>
              <div className="quick-steps">
                <QuickStep icon={<CircleDollarSign size={18} />} label="Virtual EscrowCoins" />
                <QuickStep icon={<LockKeyhole size={18} />} label="Automatic lock" />
                <QuickStep icon={<FileCheck2 size={18} />} label="Evidence receipt" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {account ? (
                  <button onClick={() => { clearAccount(); setAccount(null); setWallet(null); }} className="secondary-button">{t.logout}</button>
                ) : (
                  <button onClick={() => { setAuthMode('login'); setAuthOpen(true); }} className="primary-button">{t.signIn}</button>
                )}
                <button onClick={() => setQrOpen(true)} className="secondary-button"><QrCode size={17} /> Open by QR</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {notice && <div className="mx-auto max-w-7xl px-4 pt-4"><div className="app-notice" role="status"><CheckCircle2 size={17} />{notice}</div></div>}

      <section className="mx-auto max-w-7xl px-4 py-5">
        <div className="wallet-strip">
          <WalletStat icon={<WalletCards size={19} />} label={t.available} value={wallet?.available ?? '—'} accent="green" />
          <WalletStat icon={<LockKeyhole size={19} />} label={t.locked} value={wallet?.locked ?? '—'} accent="orange" />
          <WalletStat icon={<CircleDollarSign size={19} />} label={t.total} value={wallet?.total ?? 1000} accent="blue" />
        </div>
        <OnChainWalletPanel match={featuredMatch} />
      </section>

      {sharedAgreement && (
        <section className="mx-auto max-w-7xl px-4 pb-2">
          <div className="shared-challenge">
            <div>
              <p className="section-kicker">Shared challenge</p>
              <h2 className="mt-2 text-xl font-black text-white">{sharedAgreement.match.homeTeam} vs {sharedAgreement.match.awayTeam}</h2>
              <p className="mt-2 text-sm text-slate-300">{sharedAgreement.creator.email} invites you to compete for a {sharedAgreement.pot} EscrowCoin pool.</p>
            </div>
            <button onClick={() => requireAuth(() => document.getElementById('agreements')?.scrollIntoView({ behavior: 'smooth' }))} className="primary-button">View challenge <ChevronRight size={17} /></button>
          </div>
        </section>
      )}

      <section id="matches" className="mx-auto max-w-7xl px-4 py-7">
        <div className="section-heading">
          <div><p className="section-kicker">Markets</p><h2 className="section-title">{t.matches}</h2></div>
          <span className="match-count">{filteredMatches.length} events</span>
        </div>
        <div className="search-control mt-4"><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.filter} /></div>
        <div className="filter-scroll" aria-label="Match stage filters">
          {[
            ['all', 'All'], ['group', 'Groups'], ['round32', 'Round of 32'],
            ['round16', 'Round of 16'], ['quarters', 'Quarterfinals'], ['semis', 'Semifinals'], ['final', 'Final'],
          ].map(([value, label]) => (
            <button key={value} onClick={() => setStageFilter(value)} className={stageFilter === value ? 'active' : ''}>{label}</button>
          ))}
        </div>
        <div className="match-grid">
          {filteredMatches.slice(0, 104).map((match) => (
            <button key={match.matchId} onClick={() => requireAuth(() => setSelected(match))} className="market-card text-left">
              <div className="market-meta">
                <span className="market-stage">{match.groupCode ? `Group ${match.groupCode}` : match.stage || 'World Cup'}</span>
                <span className="flex items-center gap-1"><Clock3 size={12} />{formatKickoff(match.kickoffUtc, locale)}</span>
              </div>
              <div className="market-team"><TeamDot name={match.homeTeam} /><strong>{match.homeTeam}</strong><span>—</span></div>
              <div className="market-team"><TeamDot name={match.awayTeam} /><strong>{match.awayTeam}</strong><span>—</span></div>
              <div className="market-footer">
                <span className="truncate">{[match.stadium, match.city].filter(Boolean).join(' · ') || 'Venue TBA'}</span>
                <span className="market-action">Challenge <ChevronRight size={14} /></span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section id="agreements" className="agreements-band">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-9 lg:grid-cols-2">
          <AgreementList title={t.open} agreements={openAgreements} empty={t.empty}>
            {(agreement) => (
              <form onSubmit={(event) => acceptAgreement(event, agreement)} className="agreement-action-row">
                <ScoreFields />
                <button disabled={busy} className="primary-button">{t.accept}</button>
              </form>
            )}
          </AgreementList>
          <AgreementList title={t.mine} agreements={myAgreements} empty={t.empty}>
            {(agreement) => (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {agreement.status === 'awaiting_result' && <button disabled={busy} onClick={() => settle(agreement)} className="primary-button">{t.settle}</button>}
                {agreement.status === 'open' && <button onClick={() => shareAgreement(agreement)} className="secondary-button"><Share2 size={16} /> Share</button>}
                {agreement.settlement?.receiptHash && <code className="truncate text-xs text-[#73f7ae]">{t.receipt}: {agreement.settlement.receiptHash}</code>}
              </div>
            )}
          </AgreementList>
        </div>
      </section>

      <section id="leaderboard" className="mx-auto max-w-7xl px-4 py-9">
        <div className="section-heading">
          <div><p className="section-kicker">Verified settlements</p><h2 className="section-title">{t.leaderboard}</h2></div>
          <Trophy className="text-[#ffad42]" size={26} />
        </div>
        <div className="leaderboard-board">
          {leaders.length ? leaders.map((leader, index) => (
            <div key={leader._id} className="leader-row">
              <strong className={index < 3 ? 'leader-rank top' : 'leader-rank'}>#{index + 1}</strong>
              <div className="user-orb small"><UserRound size={15} /></div>
              <code className="truncate text-sm text-slate-300">{leader._id}</code>
              <span className="text-sm text-white">{leader.wins} wins</span>
              <strong className="text-[#73f7ae]">{leader.escrowCoinsWon} EC</strong>
            </div>
          )) : <p className="p-5 text-sm text-slate-400">{t.empty}</p>}
        </div>
      </section>

      <TechnologyReel />

      <div className="disclaimer-band">
        <div className="mx-auto grid max-w-7xl gap-2 px-4 py-5 text-xs text-slate-400 sm:grid-cols-2 lg:grid-cols-4">
          {DISCLAIMERS.map((item) => <p key={item}><ShieldCheck size={13} />{item}</p>)}
        </div>
      </div>

      {selected && (
        <Modal title={`${selected.homeTeam} vs ${selected.awayTeam}`} onClose={() => setSelected(null)}>
          <form onSubmit={createAgreement} className="challenge-form">
            <div className="sheet-match-summary"><TeamCrest name={selected.homeTeam} compact /><span>VS</span><TeamCrest name={selected.awayTeam} compact /></div>
            <div className="form-section">
              <label className="form-label">{t.prediction}</label>
              <p className="form-helper">Set the exact full-time score.</p>
              <div className="mt-3"><ScoreFields large /></div>
            </div>
            <div className="form-section">
              <label className="form-label">{t.stake}</label>
              <div className="stake-input"><CircleDollarSign size={20} /><input name="stake" type="number" min="1" max="1000" defaultValue="50" /><span>EC</span></div>
              <p className="form-helper">Both players lock the same virtual amount.</p>
            </div>
            <div className="settlement-preview"><LockKeyhole size={18} /><span>Conditional escrow pool</span><strong>2 x stake</strong></div>
            <button disabled={busy} className="primary-button w-full">{t.publish} <ArrowRight size={18} /></button>
          </form>
        </Modal>
      )}

      {authOpen && (
        <Modal title={authMode === 'login' ? t.signIn : t.register} onClose={() => setAuthOpen(false)}>
          <form onSubmit={handleAuth} className="space-y-4">
            <a href={`${API_URL}/api/auth/google?source=escrow-challenge`} className="social-button bg-white text-slate-950"><strong>G</strong> Continue with Google</a>
            {process.env.NEXT_PUBLIC_APPLE_AUTH_ENABLED === 'true' && (
              <a href={`${API_URL}/api/auth/apple?source=escrow-challenge`} className="social-button bg-black text-white">Continue with Apple</a>
            )}
            <div className="form-divider"><span />or email<span /></div>
            <div><label className="form-label">{t.email}</label><input name="email" type="email" autoComplete="email" required className="form-field mt-2 w-full" /></div>
            <div><label className="form-label">{t.password}</label><input name="password" type="password" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} minLength={6} required className="form-field mt-2 w-full" /></div>
            <button disabled={busy} className="primary-button w-full">{authMode === 'login' ? t.signIn : t.register}</button>
            <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="auth-switch">{authMode === 'login' ? t.register : t.signIn}</button>
          </form>
        </Modal>
      )}

      {qrOpen && (
        <Modal title="Open on your phone" onClose={() => setQrOpen(false)}>
          <div className="text-center">
            {qrDataUrl && <Image src={qrDataUrl} width={280} height={280} unoptimized alt="QR code to open EscrowBet.cool" className="mx-auto w-full max-w-[280px] rounded-md bg-white p-3" />}
            <p className="mt-4 text-sm leading-6 text-slate-300">Scan with your phone camera. No App Store required. Then choose Add to Home Screen.</p>
          </div>
        </Modal>
      )}

      <MobileNav onQr={() => setQrOpen(true)} />
    </div>
  );
}

function MobileNav({ onQr }: { onQr: () => void }) {
  return (
    <nav className="mobile-app-nav">
      <a href="#matches"><CalendarDays /><small>Matches</small></a>
      <a href="#agreements"><ShieldCheck /><small>Challenges</small></a>
      <a href="#leaderboard"><Trophy /><small>Ranking</small></a>
      <button onClick={onQr}><QrCode /><small>QR</small></button>
    </nav>
  );
}

const TECHNOLOGY_REEL = [
  { number: '01', title: 'Conditional Escrow', text: 'Lock virtual credits until verifiable conditions are completed.', accent: 'green', icon: <LockKeyhole /> },
  { number: '02', title: 'Evidence Layer', text: 'Preserve structured evidence and its integrity with hashes.', accent: 'blue', icon: <ShieldCheck /> },
  { number: '03', title: 'Programmable Agreements', text: 'Translate commitments into traceable execution workflows.', accent: 'orange', icon: <CircleDollarSign /> },
  { number: '04', title: 'Verifiable Receipts', text: 'Generate final proof for every conditional settlement.', accent: 'purple', icon: <FileCheck2 /> },
] as const;

function TechnologyReel() {
  const reel = [...TECHNOLOGY_REEL, ...TECHNOLOGY_REEL];
  return (
    <section className="technology-reel-section py-9">
      <div className="mx-auto mb-5 flex max-w-7xl items-end justify-between gap-4 px-4">
        <div><p className="section-kicker">UDoChain technology</p><h2 className="section-title">Protocol intelligence</h2></div>
        <span className="hidden font-mono text-xs text-slate-500 sm:block">TECH REEL 01—04</span>
      </div>
      <div className="technology-reel overflow-hidden">
        <div className="technology-reel-track">
          {reel.map((item, index) => (
            <article key={`${item.number}-${index}`} className={`technology-slide technology-slide-${item.accent}`}>
              <div className="technology-slide-head"><span>{item.icon}</span><strong>{item.number}</strong></div>
              <div className="mt-auto">
                <h3 className="text-xl font-black text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p>
                <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Powered by UDoChain</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeamCrest({ name, compact = false }: { name: string; compact?: boolean }) {
  const initials = name.split(/\s+/).map((part) => part[0]).join('').slice(0, 3).toUpperCase();
  return (
    <div className={compact ? 'team-crest compact' : 'team-crest'}>
      <div className="crest-circle">{initials}</div>
      <strong>{name}</strong>
    </div>
  );
}

function TeamDot({ name }: { name: string }) {
  return <span className="team-dot">{name.slice(0, 2).toUpperCase()}</span>;
}

function QuickStep({ icon, label }: { icon: ReactNode; label: string }) {
  return <div><span>{icon}</span><strong>{label}</strong><CheckCircle2 size={15} /></div>;
}

function ScoreFields({ large = false }: { large?: boolean }) {
  return (
    <div className={large ? 'score-fields large' : 'score-fields'}>
      <input aria-label="Home score" inputMode="numeric" name="homeScore" type="number" min="0" max="30" defaultValue="1" />
      <span>:</span>
      <input aria-label="Away score" inputMode="numeric" name="awayScore" type="number" min="0" max="30" defaultValue="0" />
    </div>
  );
}

function WalletStat({ icon, label, value, accent }: { icon: ReactNode; label: string; value: string | number; accent: string }) {
  return (
    <div className={`wallet-stat wallet-${accent}`}>
      <span className="wallet-icon">{icon}</span>
      <div><p>{label}</p><strong>{value}</strong><small>EscrowCoins</small></div>
    </div>
  );
}

function AgreementList({ title, agreements, empty, children }: { title: string; agreements: Agreement[]; empty: string; children: (agreement: Agreement) => ReactNode }) {
  return (
    <div>
      <div className="section-heading"><h2 className="section-title">{title}</h2><span className="match-count">{agreements.length}</span></div>
      <div className="mt-5 space-y-3">
        {agreements.length ? agreements.map((agreement) => (
          <article key={agreement.challengeId} className="agreement-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="agreement-id">{agreement.challengeId.slice(0, 14)}</span>
                <strong className="mt-2 block text-white">{agreement.match.homeTeam} vs {agreement.match.awayTeam}</strong>
                <p className="mt-1 truncate text-xs text-slate-500">{agreement.creator.email}</p>
              </div>
              <span className="status-chip">{agreement.status.replace('_', ' ')}</span>
            </div>
            <div className="agreement-numbers">
              <div><span>Prediction</span><strong>{agreement.creator.prediction.homeScore}:{agreement.creator.prediction.awayScore}</strong></div>
              <div><span>Stake</span><strong>{agreement.stakePerPlayer} EC</strong></div>
              <div><span>Pool</span><strong>{agreement.pot} EC</strong></div>
            </div>
            {children(agreement)}
          </article>
        )) : <p className="empty-state">{empty}</p>}
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-scrim" onMouseDown={onClose}>
      <div className="app-sheet" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header"><h2>{title}</h2><button onClick={onClose} aria-label="Close"><X size={21} /></button></div>
        {children}
      </div>
    </div>
  );
}

function matchStageKey(match: Match) {
  const value = `${match.stage || ''} ${match.groupCode || ''}`.toLowerCase();
  if (match.groupCode || value.includes('group')) return 'group';
  if (value.includes('32')) return 'round32';
  if (value.includes('16')) return 'round16';
  if (value.includes('quarter')) return 'quarters';
  if (value.includes('semi')) return 'semis';
  if (value.includes('final') && !value.includes('semi')) return 'final';
  return 'group';
}

function formatKickoff(value: string | undefined, locale: Locale) {
  if (!value) return 'TBD';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}
