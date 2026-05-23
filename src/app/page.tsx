'use client';

import { useEffect, useMemo, useState } from 'react';
import VoucherQr from '@/components/VoucherQr';
import { useLocale, type Locale } from '@/components/LocaleProvider';
import { qualifiesForAward } from '@/lib/awardEngine';

type CouponRule = 'participate' | 'winner' | 'exact' | 'goal_diff' | 'home_goals' | 'away_goals' | 'first_half_goals';
type Tab = 'matches' | 'predictions' | 'vouchers' | 'promos';
type FixtureView = 'date' | 'group' | 'team' | 'city' | 'venue';

type Match = {
  id: number;
  group: string;
  date: string;
  time: string;
  kickoffUtc: string;
  timezone: string;
  city: string;
  venue: string;
  home: string;
  away: string;
  homeFlag: string;
  awayFlag: string;
  homeScore: number | null;
  awayScore: number | null;
};

type Fan = {
  id: number;
  name: string;
  handle: string;
  contact: string;
  channel: 'whatsapp' | 'email';
  deviceId: string;
};

type Prediction = {
  id: number;
  userId: number;
  matchId: number;
  homeScore: number;
  awayScore: number;
};

type Coupon = {
  id: number;
  merchant: string;
  zone: string;
  offer: string;
  rule: CouponRule;
  quantity: number;
  link: string;
  level: 'Oro' | 'Plata' | 'Barrio';
  expires: string;
};

type Voucher = {
  id: number;
  code: string;
  status: string;
  title: string;
  prize: string;
  expires_at: string;
  image_url: string | null;
  merchant_name: string;
  zone: string;
  link: string;
  home_team: string;
  away_team: string;
  home_code: string;
  away_code: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://bet2back-production.up.railway.app';

const matchesSeed: Match[] = [
  { id: 1, group: 'Grupo A', date: '11 Jun', time: '13:00', kickoffUtc: '2026-06-11T19:00:00Z', timezone: 'America/Mexico_City', city: 'Mexico City', venue: 'Mexico City Stadium', home: 'Mexico', away: 'South Africa', homeFlag: 'MEX', awayFlag: 'RSA', homeScore: null, awayScore: null },
  { id: 2, group: 'Grupo A', date: '11 Jun', time: '20:00', kickoffUtc: '2026-06-12T02:00:00Z', timezone: 'America/Mexico_City', city: 'Guadalajara', venue: 'Guadalajara Stadium', home: 'Korea Republic', away: 'Czechia', homeFlag: 'KOR', awayFlag: 'CZE', homeScore: null, awayScore: null },
  { id: 3, group: 'Grupo B', date: '12 Jun', time: '15:00', kickoffUtc: '2026-06-12T19:00:00Z', timezone: 'America/Toronto', city: 'Toronto', venue: 'Toronto Stadium', home: 'Canada', away: 'Bosnia & Herzegovina', homeFlag: 'CAN', awayFlag: 'BIH', homeScore: null, awayScore: null },
  { id: 4, group: 'Grupo D', date: '12 Jun', time: '18:00', kickoffUtc: '2026-06-13T01:00:00Z', timezone: 'America/Los_Angeles', city: 'Los Angeles', venue: 'Los Angeles Stadium', home: 'United States', away: 'Paraguay', homeFlag: 'USA', awayFlag: 'PAR', homeScore: null, awayScore: null },
  { id: 5, group: 'Grupo C', date: '13 Jun', time: '18:00', kickoffUtc: '2026-06-13T22:00:00Z', timezone: 'America/New_York', city: 'New York New Jersey', venue: 'New York New Jersey Stadium', home: 'Brazil', away: 'Morocco', homeFlag: 'BRA', awayFlag: 'MAR', homeScore: null, awayScore: null },
  { id: 6, group: 'Grupo J', date: '16 Jun', time: '21:00', kickoffUtc: '2026-06-17T01:00:00Z', timezone: 'America/New_York', city: 'Miami', venue: 'Miami Stadium', home: 'Argentina', away: 'Algeria', homeFlag: 'ARG', awayFlag: 'ALG', homeScore: null, awayScore: null },
];

const fansSeed: Fan[] = [];

const predictionsSeed: Prediction[] = [];

const couponsSeed: Coupon[] = [
  { id: 1, merchant: 'Boliche La Final', zone: 'Tlalpan / Azteca', offer: '2x1 en entrada antes de medianoche', rule: 'exact', quantity: 80, link: 'https://maps.google.com/?q=Estadio+Azteca', level: 'Oro', expires: '12 Jun 23:59' },
  { id: 2, merchant: 'Terraza Gol Norte', zone: 'Guadalajara', offer: 'Bucket 3x2 para mesa mundialista', rule: 'winner', quantity: 120, link: 'https://maps.google.com/?q=Estadio+Akron', level: 'Plata', expires: '13 Jun 23:59' },
  { id: 3, merchant: 'Fan Zone Burger', zone: 'Monterrey', offer: 'Papas gratis con cualquier combo', rule: 'participate', quantity: 200, link: 'https://maps.google.com/?q=Estadio+BBVA', level: 'Barrio', expires: '30 Jun 23:59' },
  { id: 4, merchant: 'After Match Club', zone: 'Miami', offer: '15% off en lista VIP', rule: 'exact', quantity: 60, link: 'https://maps.google.com/?q=Hard+Rock+Stadium', level: 'Oro', expires: '18 Jun 23:59' },
];

const text: Record<Locale, Record<string, string>> = {
  en: {
    kicker: 'World fantasy bet',
    title: 'Predict, win vouchers, show your QR.',
    body: 'Join with almost no friction: choose a match, save your score, and claim local rewards if you hit.',
    matches: 'Matches',
    predictions: 'My predictions',
    vouchers: 'My vouchers',
    promos: 'Promos',
    play: 'Predict this match',
    save: 'Save prediction',
    register: 'Quick registration',
    selectFan: 'Choose fan',
    newFan: 'New fan',
    name: 'Name',
    contact: 'WhatsApp or email',
    device: 'Device ID',
    noVouchers: 'No vouchers yet. Win a result to unlock one.',
    valid: 'Valid voucher',
    expires: 'Expires',
    verify: 'Local verifies this QR at the venue.',
    go: 'Open local',
    available: 'available',
    closed: 'Result loaded',
    open: 'Open for predictions',
    localTime: 'Your time',
    stadiumTime: 'Stadium time',
    fallbackTime: 'Standard time',
    venue: 'Venue',
    fixtureView: 'View by',
    filter: 'Search team, city, group or stadium',
    date: 'Date',
    group: 'Group',
    team: 'Team',
    city: 'City',
  },
  es: {
    kicker: 'Fantasy bet mundialista',
    title: 'Pronostica, gana vales y muestra tu QR.',
    body: 'Participa sin friccion: elige partido, guarda marcador y reclama premios locales si aciertas.',
    matches: 'Partidos',
    predictions: 'Mis predicciones',
    vouchers: 'Mis vales',
    promos: 'Promos',
    play: 'Pronosticar este partido',
    save: 'Guardar prediccion',
    register: 'Registro rapido',
    selectFan: 'Elegir fan',
    newFan: 'Nuevo fan',
    name: 'Nombre',
    contact: 'WhatsApp o email',
    device: 'Device ID',
    noVouchers: 'Todavia no tienes vales. Acierta un resultado para desbloquear uno.',
    valid: 'Vale valido',
    expires: 'Vence',
    verify: 'El local verifica este QR en el lugar.',
    go: 'Ver local',
    available: 'disponibles',
    closed: 'Resultado cargado',
    open: 'Abierto a predicciones',
    localTime: 'Tu horario',
    stadiumTime: 'Horario estadio',
    fallbackTime: 'Horario estandar',
    venue: 'Estadio',
    fixtureView: 'Ver por',
    filter: 'Buscar equipo, ciudad, grupo o estadio',
    date: 'Fecha',
    group: 'Grupo',
    team: 'Equipo',
    city: 'Ciudad',
  },
  pt: {
    kicker: 'Fantasy bet mundial',
    title: 'Dê seu palpite, ganhe cupons e mostre seu QR.',
    body: 'Participe sem fricção: escolha o jogo, salve o placar e resgate prêmios locais se acertar.',
    matches: 'Jogos',
    predictions: 'Minhas apostas',
    vouchers: 'Meus cupons',
    promos: 'Promoções',
    play: 'Apostar neste jogo',
    save: 'Salvar aposta',
    register: 'Registro rápido',
    selectFan: 'Escolher fã',
    newFan: 'Novo fã',
    name: 'Nome',
    contact: 'WhatsApp ou email',
    device: 'Device ID',
    noVouchers: 'Ainda não há cupons. Acerte um resultado para desbloquear um.',
    valid: 'Cupom válido',
    expires: 'Vence',
    verify: 'O local verifica este QR no estabelecimento.',
    go: 'Abrir local',
    available: 'disponíveis',
    closed: 'Resultado carregado',
    open: 'Aberto para apostas',
    localTime: 'Seu horario',
    stadiumTime: 'Horario do estadio',
    fallbackTime: 'Horario padrao',
    venue: 'Estadio',
    fixtureView: 'Ver por',
    filter: 'Buscar time, cidade, grupo ou estadio',
    date: 'Data',
    group: 'Grupo',
    team: 'Time',
    city: 'Cidade',
  },
  fr: {
    kicker: 'Fantasy bet mondial',
    title: 'Pronostiquez, gagnez des coupons et montrez votre QR.',
    body: 'Participez sans friction: choisissez un match, enregistrez le score et réclamez des prix locaux si vous gagnez.',
    matches: 'Matchs',
    predictions: 'Mes pronostics',
    vouchers: 'Mes coupons',
    promos: 'Promos',
    play: 'Pronostiquer ce match',
    save: 'Enregistrer',
    register: 'Inscription rapide',
    selectFan: 'Choisir fan',
    newFan: 'Nouveau fan',
    name: 'Nom',
    contact: 'WhatsApp ou email',
    device: 'Device ID',
    noVouchers: 'Aucun coupon pour le moment. Trouvez un résultat pour en débloquer un.',
    valid: 'Coupon valide',
    expires: 'Expire',
    verify: 'Le commerce vérifie ce QR sur place.',
    go: 'Voir le lieu',
    available: 'disponibles',
    closed: 'Résultat chargé',
    open: 'Ouvert aux pronostics',
    localTime: 'Votre heure',
    stadiumTime: 'Heure du stade',
    fallbackTime: 'Heure standard',
    venue: 'Stade',
    fixtureView: 'Voir par',
    filter: 'Chercher equipe, ville, groupe ou stade',
    date: 'Date',
    group: 'Groupe',
    team: 'Equipe',
    city: 'Ville',
  },
};

const localeCodes: Record<Locale, string> = {
  en: 'en-US',
  es: 'es-MX',
  pt: 'pt-BR',
  fr: 'fr-FR',
};

function detectDeviceTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Mexico_City';
  } catch {
    return 'America/Mexico_City';
  }
}

function formatInTimeZone(iso: string, locale: Locale, timeZone: string) {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return null;
  return new Intl.DateTimeFormat(localeCodes[locale], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }).format(value);
}

function formatMatchSchedule(match: Match, locale: Locale) {
  const deviceTimeZone = detectDeviceTimeZone();
  const fallback = `${match.date}${match.time ? `, ${match.time}` : ''}`;
  if (!match.kickoffUtc) {
    return {
      local: fallback,
      stadium: fallback,
      usedFallback: true,
    };
  }
  const local = formatInTimeZone(match.kickoffUtc, locale, deviceTimeZone) || fallback;
  const stadium = formatInTimeZone(match.kickoffUtc, locale, match.timezone || 'UTC') || fallback;
  return {
    local,
    stadium,
    usedFallback: local === fallback && stadium === fallback,
  };
}

function fixtureKey(match: Match, view: FixtureView, locale: Locale) {
  if (view === 'date') return formatMatchSchedule(match, locale).local.split(',')[0] || match.date;
  if (view === 'group') return match.group;
  if (view === 'team') return `${match.homeFlag} / ${match.awayFlag}`;
  if (view === 'city') return match.city;
  return match.venue;
}

function matchSearchText(match: Match) {
  return [
    match.group,
    match.date,
    match.time,
    match.city,
    match.venue,
    match.home,
    match.away,
    match.homeFlag,
    match.awayFlag,
  ].join(' ').toLowerCase();
}

function wins(prediction: Prediction, match: Match, coupon: Coupon) {
  return qualifiesForAward(prediction, match, coupon.rule);
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  if (!response.ok) throw new Error(`API ${path} failed`);
  return response.json() as Promise<T>;
}

function mapMatch(row: Record<string, unknown>): Match {
  const fallbackDate = row.match_date ? new Date(String(row.match_date)).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) : '';
  const fallbackTime = row.match_date ? new Date(String(row.match_date)).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
  return {
    id: Number(row.id),
    group: String(row.group_name || row.phase || ''),
    date: fallbackDate,
    time: fallbackTime,
    kickoffUtc: String(row.kickoff_utc || ''),
    timezone: String(row.match_timezone || 'UTC'),
    city: String(row.city || ''),
    venue: String(row.venue || ''),
    home: String(row.home_team || ''),
    away: String(row.away_team || ''),
    homeFlag: String(row.home_code || '').slice(0, 3),
    awayFlag: String(row.away_code || '').slice(0, 3),
    homeScore: row.home_score === null ? null : Number(row.home_score),
    awayScore: row.away_score === null ? null : Number(row.away_score),
  };
}

function mapFan(row: Record<string, unknown>): Fan {
  return {
    id: Number(row.id),
    name: String(row.name || ''),
    handle: String(row.handle || ''),
    contact: String(row.contact || ''),
    channel: String(row.channel || 'whatsapp') as Fan['channel'],
    deviceId: String(row.device_id || ''),
  };
}

function mapPrediction(row: Record<string, unknown>): Prediction {
  return {
    id: Number(row.id),
    userId: Number(row.fan_id),
    matchId: Number(row.match_id),
    homeScore: Number(row.home_score),
    awayScore: Number(row.away_score),
  };
}

function mapReward(row: Record<string, unknown>): Coupon {
  return {
    id: Number(row.id),
    merchant: String(row.merchant_name || ''),
    zone: String(row.zone || ''),
    offer: String(row.prize || ''),
    rule: String(row.rule || 'participate') as CouponRule,
    quantity: Number(row.quantity || 0),
    link: String(row.link || '#'),
    level: 'Oro',
    expires: String(row.expires_at || ''),
  };
}

export default function HomePage() {
  const { locale } = useLocale();
  const t = text[locale];
  const [tab, setTab] = useState<Tab>('matches');
  const [matches, setMatches] = useState(matchesSeed);
  const [fans, setFans] = useState(fansSeed);
  const [predictions, setPredictions] = useState(predictionsSeed);
  const [coupons, setCoupons] = useState(couponsSeed);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState(matchesSeed[0].id);
  const [selectedFanId, setSelectedFanId] = useState<number | 'new'>('new');
  const [fixtureView, setFixtureView] = useState<FixtureView>('date');
  const [fixtureFilter, setFixtureFilter] = useState('');
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    const saved = window.localStorage.getItem('golazo-device-id');
    if (saved) {
      setDeviceId(saved);
      return;
    }
    const generated = `GP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    window.localStorage.setItem('golazo-device-id', generated);
    setDeviceId(generated);
  }, []);

  useEffect(() => {
    apiFetch<Record<string, unknown>[]>('/api/matches')
      .then((rows) => {
        const nextMatches = rows.map(mapMatch);
        if (nextMatches.length > 0) {
          setMatches(nextMatches);
          setSelectedMatchId(nextMatches[0].id);
        }
      })
      .catch(() => undefined);

    apiFetch<Record<string, unknown>[]>('/api/merchant-rewards')
      .then((rows) => setCoupons(rows.map(mapReward)))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!deviceId) return;
    apiFetch<Record<string, unknown>[]>(`/api/fans?device_id=${encodeURIComponent(deviceId)}`)
      .then((rows) => {
        const nextFans = rows.map(mapFan);
        if (nextFans.length > 0) {
          setFans(nextFans);
          setSelectedFanId(nextFans[0].id);
        }
      })
      .catch(() => undefined);
  }, [deviceId]);

  const activeFan = selectedFanId === 'new' ? null : fans.find((fan) => fan.id === selectedFanId) ?? fans[0];
  const selectedMatch = matches.find((match) => match.id === selectedMatchId) ?? matches[0];
  const myPredictions = activeFan ? predictions.filter((prediction) => prediction.userId === activeFan.id) : [];
  const filteredMatches = useMemo(() => {
    const search = fixtureFilter.trim().toLowerCase();
    return matches.filter((match) => !search || matchSearchText(match).includes(search));
  }, [fixtureFilter, matches]);
  const fixtureGroups = useMemo(() => {
    const groups = new Map<string, Match[]>();
    filteredMatches.forEach((match) => {
      const key = fixtureKey(match, fixtureView, locale);
      groups.set(key, [...(groups.get(key) || []), match]);
    });
    return [...groups.entries()];
  }, [filteredMatches, fixtureView, locale]);
  const localVouchers = useMemo(() => {
    if (!activeFan) return [];
    return predictions
      .filter((prediction) => prediction.userId === activeFan.id)
      .flatMap((prediction) => {
        const match = matches.find((item) => item.id === prediction.matchId);
        if (!match) return [];
        return couponsSeed
          .filter((coupon) => wins(prediction, match, coupon))
          .map((coupon) => ({
            coupon,
            match,
            prediction,
            code: `${coupon.merchant.replace(/\s/g, '').slice(0, 4).toUpperCase()}-${activeFan.handle}-${prediction.id}`,
          }));
      });
  }, [activeFan, matches, predictions]);

  useEffect(() => {
    if (!activeFan) return;
    apiFetch<Record<string, unknown>[]>(`/api/fans/${activeFan.id}/predictions`)
      .then((rows) => setPredictions(rows.map(mapPrediction)))
      .catch(() => undefined);
    apiFetch<Voucher[]>(`/api/fans/${activeFan.id}/vouchers`)
      .then(setVouchers)
      .catch(() => undefined);
  }, [activeFan?.id]);

  async function savePrediction(formData: FormData) {
    let userId = Number(formData.get('userId'));
    if (formData.get('userId') === 'new') {
      const name = String(formData.get('name') || 'Fan');
      const id = Date.now();
      const fallbackFan = {
        id,
        name,
        handle: `${name.slice(0, 3).toUpperCase()}-${String(id).slice(-3)}`,
        contact: String(formData.get('contact') || ''),
        channel: 'whatsapp',
        deviceId,
      } satisfies Fan;
      try {
        const created = await apiFetch<Record<string, unknown>>('/api/fans', {
          method: 'POST',
          body: JSON.stringify({
            name,
            contact: fallbackFan.contact,
            channel: 'whatsapp',
            device_id: deviceId,
            handle: fallbackFan.handle,
          }),
        });
        const fan = mapFan(created);
        userId = fan.id;
        setFans((current) => [fan, ...current]);
        setSelectedFanId(fan.id);
      } catch {
        userId = id;
        setFans((current) => [fallbackFan, ...current]);
        setSelectedFanId(id);
      }
    }

    const nextPrediction = {
      id: Date.now(),
      userId,
      matchId: Number(formData.get('matchId')),
      homeScore: Number(formData.get('homeScore')),
      awayScore: Number(formData.get('awayScore')),
    } satisfies Prediction;

    try {
      const created = await apiFetch<Record<string, unknown>>('/api/predictions', {
        method: 'POST',
        body: JSON.stringify({
          fan_id: userId,
          match_id: nextPrediction.matchId,
          home_score: nextPrediction.homeScore,
          away_score: nextPrediction.awayScore,
        }),
      });
      setPredictions((current) => [mapPrediction(created), ...current.filter((item) => item.matchId !== nextPrediction.matchId || item.userId !== userId)]);
      const nextVouchers = await apiFetch<Voucher[]>(`/api/fans/${userId}/vouchers`);
      setVouchers(nextVouchers);
    } catch {
      setPredictions((current) => [nextPrediction, ...current]);
    }
    setTab('predictions');
  }

  return (
    <div className="stadium-surface min-h-screen text-white">
      <section className="world-hero-bg relative overflow-hidden border-b border-white/10">
        <div className="trophy-silhouette hidden md:block" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-amber-300">{t.kicker}</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight md:text-6xl">{t.title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">{t.body}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Pill label={`${matches.length} ${t.matches}`} />
              <Pill label={`${myPredictions.length} ${t.predictions}`} />
              <Pill label={`${vouchers.length || localVouchers.length} ${t.vouchers}`} />
            </div>
          </div>
          <MatchHero match={selectedMatch} locale={locale} t={t} />
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-white/10 p-2 md:grid-cols-4">
          {(['matches', 'predictions', 'vouchers', 'promos'] as Tab[]).map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`h-12 rounded-md text-sm font-black transition ${tab === item ? 'bg-amber-300 text-slate-950' : 'text-slate-200 hover:bg-white/10'}`}
              type="button"
            >
              {t[item]}
            </button>
          ))}
        </div>

        {tab === 'matches' && (
          <section id="fixture" className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="glass-panel rounded-lg p-5">
              <SectionTitle title={t.matches} helper="Choose a match. Prediction opens on the right." />
              <div className="mt-5 grid gap-3 md:grid-cols-[0.7fr_1.3fr]">
                <label className="grid gap-2 text-sm font-semibold text-slate-300">
                  {t.fixtureView}
                  <select
                    value={fixtureView}
                    onChange={(event) => setFixtureView(event.target.value as FixtureView)}
                    className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-amber-300"
                  >
                    <option value="date">{t.date}</option>
                    <option value="group">{t.group}</option>
                    <option value="team">{t.team}</option>
                    <option value="city">{t.city}</option>
                    <option value="venue">{t.venue}</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-300">
                  {t.filter}
                  <input
                    value={fixtureFilter}
                    onChange={(event) => setFixtureFilter(event.target.value)}
                    className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-amber-300"
                    placeholder="Mexico, Grupo A, Toronto..."
                  />
                </label>
              </div>
              <div className="mt-5 grid gap-5">
                {fixtureGroups.map(([group, groupMatches]) => (
                  <div key={group} className="grid gap-3">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">{group}</h3>
                    {groupMatches.map((match) => {
                      const schedule = formatMatchSchedule(match, locale);
                      return (
                        <button
                          key={match.id}
                          onClick={() => setSelectedMatchId(match.id)}
                          className={`fixture-card rounded-lg border p-4 text-left transition ${selectedMatchId === match.id ? 'border-amber-300' : 'border-white/10 hover:border-amber-300/60'}`}
                          type="button"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{match.group} - {match.city}</p>
                              <h3 className="mt-2 text-xl font-black">{match.homeFlag} {match.home} vs {match.awayFlag} {match.away}</h3>
                              <div className="mt-3 grid gap-1 text-sm text-slate-300 md:grid-cols-2">
                                <span>{t.localTime}: <strong className="text-white">{schedule.local}</strong></span>
                                <span>{t.venue}: <strong className="text-white">{match.venue}</strong></span>
                                <span className="md:col-span-2">{t.stadiumTime}: {schedule.stadium} - {match.city}</span>
                              </div>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-black ${match.homeScore === null ? 'bg-emerald-300 text-slate-950' : 'bg-white/10 text-slate-200'}`}>
                              {match.homeScore === null ? t.open : t.closed}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
                {fixtureGroups.length === 0 && <Empty text={t.filter} />}
              </div>
            </div>
            <PredictionPanel
              id="predict"
              t={t}
              match={selectedMatch}
              fans={fans}
              selectedFanId={selectedFanId}
              setSelectedFanId={setSelectedFanId}
              deviceId={deviceId}
              savePrediction={savePrediction}
            />
          </section>
        )}

        {tab === 'predictions' && (
          <section id="vouchers" className="glass-panel rounded-lg p-5">
            <SectionTitle title={t.predictions} helper={activeFan ? `${activeFan.name} - ${activeFan.handle}` : t.register} />
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {myPredictions.map((prediction) => {
                const match = matches.find((item) => item.id === prediction.matchId);
                const schedule = match ? formatMatchSchedule(match, locale) : null;
                return (
                  <article key={prediction.id} className="fixture-card rounded-lg border border-white/10 p-4">
                    <p className="text-sm text-slate-400">{match?.group} - {schedule?.local}</p>
                    <h3 className="mt-2 text-xl font-black">{match?.homeFlag} {match?.home} {prediction.homeScore}-{prediction.awayScore} {match?.awayFlag} {match?.away}</h3>
                    <p className="mt-2 text-sm text-slate-400">{match?.venue} - {match?.city}</p>
                  </article>
                );
              })}
              {myPredictions.length === 0 && <Empty text={t.save} />}
            </div>
          </section>
        )}

        {tab === 'vouchers' && (
          <section className="glass-panel rounded-lg p-5">
            <SectionTitle title={t.vouchers} helper={t.verify} />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {vouchers.length > 0 ? vouchers.map((voucher) => (
                <article key={voucher.code} className="promo-ticket rounded-lg p-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <span className="rounded-full bg-emerald-300 px-3 py-1 text-xs font-black text-slate-950">{voucher.status}</span>
                      <h3 className="mt-4 text-2xl font-black">{voucher.prize}</h3>
                      <p className="mt-2 text-sm text-slate-300">{voucher.merchant_name} - {voucher.zone}</p>
                      <p className="mt-2 text-sm text-slate-400">{voucher.home_code} {voucher.home_team} vs {voucher.away_code} {voucher.away_team}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-amber-300">{t.expires}: {voucher.expires_at}</p>
                    </div>
                    <VoucherQr value={voucher.code} />
                  </div>
                </article>
              )) : localVouchers.map(({ coupon, match, code }) => (
                <article key={code} className="promo-ticket rounded-lg p-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <span className="rounded-full bg-emerald-300 px-3 py-1 text-xs font-black text-slate-950">{t.valid}</span>
                      <h3 className="mt-4 text-2xl font-black">{coupon.offer}</h3>
                      <p className="mt-2 text-sm text-slate-300">{coupon.merchant} - {coupon.zone}</p>
                      <p className="mt-2 text-sm text-slate-400">{match.homeFlag} {match.home} vs {match.awayFlag} {match.away}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-amber-300">{t.expires}: {coupon.expires}</p>
                    </div>
                    <VoucherQr value={code} />
                  </div>
                </article>
              ))}
              {vouchers.length === 0 && localVouchers.length === 0 && <Empty text={t.noVouchers} />}
            </div>
          </section>
        )}

        {tab === 'promos' && (
          <section id="promos" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {coupons.map((coupon) => (
              <article key={coupon.id} className="promo-ticket rounded-lg">
                <div className="bg-gradient-to-r from-amber-300 via-rose-400 to-emerald-300 p-1" />
                <div className="p-4">
                  <span className="rounded-full bg-amber-300 px-2 py-1 text-xs font-black text-slate-950">{coupon.level}</span>
                  <h3 className="mt-4 text-xl font-black">{coupon.offer}</h3>
                  <p className="mt-2 text-sm text-slate-300">{coupon.merchant}</p>
                  <p className="mt-1 text-sm text-slate-400">{coupon.zone}</p>
                  <p className="mt-3 text-xs text-amber-200">{coupon.quantity} {t.available}</p>
                  <a href={coupon.link} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-md bg-white px-4 py-2 text-sm font-black text-slate-950">{t.go}</a>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

function PredictionPanel({
  id,
  t,
  match,
  fans,
  selectedFanId,
  setSelectedFanId,
  deviceId,
  savePrediction,
}: {
  id?: string;
  t: Record<string, string>;
  match: Match;
  fans: Fan[];
  selectedFanId: number | 'new';
  setSelectedFanId: (id: number | 'new') => void;
  deviceId: string;
  savePrediction: (formData: FormData) => void;
}) {
  return (
    <section id={id} className="glass-panel rounded-lg p-5">
      <SectionTitle title={t.play} helper={`${match.homeFlag} ${match.home} vs ${match.awayFlag} ${match.away}`} />
      <form action={savePrediction} className="mt-5 grid gap-4">
        <input type="hidden" name="matchId" value={match.id} />
        <label className="grid gap-2 text-sm font-semibold text-slate-300">
          {t.selectFan}
          <select
            name="userId"
            value={selectedFanId}
            onChange={(event) => setSelectedFanId(event.target.value === 'new' ? 'new' : Number(event.target.value))}
            className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-amber-300"
          >
            {fans.map((fan) => <option key={fan.id} value={fan.id}>{fan.name} - {fan.handle}</option>)}
            <option value="new">{t.newFan}</option>
          </select>
        </label>
        {selectedFanId === 'new' && (
          <div className="fan-card grid gap-3 rounded-lg border border-amber-300/20 p-4">
            <div className="rounded-md border border-white/10 bg-slate-950/80 p-3">
              <span className="text-xs uppercase tracking-[0.18em] text-amber-300">{t.device}</span>
              <strong className="mt-1 block text-lg">{deviceId || 'Generating...'}</strong>
            </div>
            <Field name="name" label={t.name} placeholder="Ana Torres" />
            <Field name="contact" label={t.contact} placeholder="+52... / fan@email.com" />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field name="homeScore" label={match.home} placeholder="0" type="number" />
          <Field name="awayScore" label={match.away} placeholder="0" type="number" />
        </div>
        <button className="fantasy-button h-12 rounded-md font-black transition">{t.save}</button>
      </form>
    </section>
  );
}

function MatchHero({ match, locale, t }: { match: Match; locale: Locale; t: Record<string, string> }) {
  const schedule = formatMatchSchedule(match, locale);
  return (
    <div className="glass-panel rounded-lg p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{match.group} - {t.localTime}: {schedule.local}</p>
          <h2 className="text-2xl font-black">{match.city}</h2>
          <p className="mt-1 text-sm text-slate-300">{t.stadiumTime}: {schedule.stadium}</p>
        </div>
        <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-black text-slate-950">{match.venue}</span>
      </div>
      <div className="pitch-card rounded-lg p-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-md border border-white/30 bg-white/10 p-5">
          <Team name={match.home} code={match.homeFlag} align="left" />
          <div className="text-center text-4xl font-black tabular-nums">{match.homeScore ?? '-'} <span className="text-emerald-200">:</span> {match.awayScore ?? '-'}</div>
          <Team name={match.away} code={match.awayFlag} align="right" />
        </div>
      </div>
    </div>
  );
}

function Pill({ label }: { label: string }) {
  return <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-black text-slate-100">{label}</span>;
}

function Team({ name, code, align }: { name: string; code: string; align: 'left' | 'right' }) {
  return <div className={align === 'right' ? 'text-right' : 'text-left'}><span className="rounded bg-white px-2 py-1 text-sm font-black text-slate-950">{code}</span><strong className="mt-2 block text-xl md:text-2xl">{name}</strong></div>;
}

function SectionTitle({ title, helper }: { title: string; helper: string }) {
  return <div><h2 className="text-2xl font-black">{title}</h2><p className="mt-1 text-sm text-slate-400">{helper}</p></div>;
}

function Field({ name, label, placeholder, type = 'text' }: { name: string; label: string; placeholder: string; type?: string }) {
  return <label className="grid gap-2 text-sm font-semibold text-slate-300">{label}<input name={name} type={type} min={type === 'number' ? 0 : undefined} placeholder={placeholder} className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-amber-300" required /></label>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-white/15 p-8 text-center text-sm text-slate-300 md:col-span-2">{text}</div>;
}
