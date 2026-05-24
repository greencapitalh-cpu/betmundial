'use client';

import { useEffect, useMemo, useState } from 'react';
import VoucherQr from '@/components/VoucherQr';
import { useLocale, type Locale } from '@/components/LocaleProvider';
import { qualifiesForAward } from '@/lib/awardEngine';
import { readAccount, saveAccount, type Account } from '@/lib/account';

type CouponRule = 'participate' | 'winner' | 'exact' | 'goal_diff' | 'home_goals' | 'away_goals' | 'first_half_goals';
type Tab = 'matches' | 'bracket' | 'predictions' | 'vouchers' | 'promos';
type FixtureView = 'date' | 'group' | 'team' | 'city' | 'venue' | 'phase';

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
  status?: string;
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
  city: string;
  zone: string;
  address: string;
  offer: string;
  rule: CouponRule;
  quantity: number;
  link: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  whatsapp: string;
  image: string;
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
  { id: 1, merchant: 'Boliche La Final', city: 'La Paz', zone: 'Centro', address: 'Zona comercial', offer: '2x1 en entrada antes de medianoche', rule: 'exact', quantity: 80, link: 'https://maps.google.com', instagram: '', facebook: '', tiktok: '', whatsapp: '', image: '/world-cup-abstract-bg.png', level: 'Oro', expires: '12 Jun 23:59' },
  { id: 2, merchant: 'Terraza Gol Norte', city: 'Guadalajara', zone: 'Zapopan', address: 'Zona bar', offer: 'Bucket 3x2 para mesa mundialista', rule: 'winner', quantity: 120, link: 'https://maps.google.com', instagram: '', facebook: '', tiktok: '', whatsapp: '', image: '/world-cup-abstract-bg.png', level: 'Plata', expires: '13 Jun 23:59' },
  { id: 3, merchant: 'Fan Zone Burger', city: 'Monterrey', zone: 'San Pedro', address: 'Zona restaurante', offer: 'Papas gratis con cualquier combo', rule: 'participate', quantity: 200, link: 'https://maps.google.com', instagram: '', facebook: '', tiktok: '', whatsapp: '', image: '/world-cup-abstract-bg.png', level: 'Barrio', expires: '30 Jun 23:59' },
  { id: 4, merchant: 'After Match Club', city: 'Santa Cruz', zone: 'Equipetrol', address: 'Zona nightlife', offer: '15% off en lista VIP', rule: 'exact', quantity: 60, link: 'https://maps.google.com', instagram: '', facebook: '', tiktok: '', whatsapp: '', image: '/world-cup-abstract-bg.png', level: 'Oro', expires: '18 Jun 23:59' },
];

const text: Record<Locale, Record<string, string>> = {
  en: {
    kicker: 'World fantasy bet',
    title: 'Predict, win vouchers, show your QR.',
    body: 'Join with almost no friction: choose a match, save your score, and claim local rewards if you hit.',
    matches: 'Matches',
    bracket: 'Bracket',
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
    phase: 'Phase',
    bracketHelper: 'Knockout path from Round of 32 to the final. Slots fill as real qualifiers are resolved.',
    thirdPlace: 'Third place',
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
    bracket: 'Llaves',
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
    phase: 'Fase',
    bracketHelper: 'Camino eliminatorio desde dieciseisavos hasta la final. Los cruces se llenan con clasificados reales.',
    thirdPlace: 'Tercer puesto',
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
    bracket: 'Chaves',
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
    phase: 'Fase',
    bracketHelper: 'Caminho eliminatorio da fase de 32 ate a final. As vagas se completam com classificados reais.',
    thirdPlace: 'Terceiro lugar',
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
    bracket: 'Tableau',
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
    phase: 'Phase',
    bracketHelper: 'Parcours eliminatoire du Round of 32 a la finale. Les places se remplissent avec les qualifies reels.',
    thirdPlace: 'Troisieme place',
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
  if (view === 'phase') return match.group;
  return match.venue;
}

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9/ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function groupLetterFromMatch(match: Match) {
  const found = normalizeSearch(match.group).match(/\b(?:group|grupo|groupe)\s+([a-l])\b/);
  return found?.[1] || '';
}

function phaseAliases(phase: string) {
  const value = normalizeSearch(phase);
  const aliases = [value];
  if (value.includes('grupos') || value.includes('group')) aliases.push('groups', 'group stage', 'fase grupos', 'fase de grupos', 'grupos');
  if (value.includes('round of 32')) aliases.push('round 32', 'r32', 'dieciseisavos', 'fase 32');
  if (value.includes('round of 16')) aliases.push('round 16', 'r16', 'octavos', 'octavos de final');
  if (value.includes('quarter')) aliases.push('quarter finals', 'quarterfinals', 'cuartos', 'cuartos de final');
  if (value.includes('semi')) aliases.push('semis', 'semifinals', 'semifinal', 'semifinales');
  if (value.includes('bronze')) aliases.push('third place', 'tercer puesto', 'bronce');
  if (value.includes('final')) aliases.push('final');
  return aliases;
}

function matchSearchText(match: Match) {
  return [
    match.group,
    match.group.replace(/^Grupo/i, 'Group'),
    match.group.replace(/^Group/i, 'Grupo'),
    match.date,
    match.time,
    match.city,
    match.venue,
    match.home,
    match.away,
    match.homeFlag,
    match.awayFlag,
    ...phaseAliases(match.group),
  ].join(' ');
}

function matchesFixtureSearch(match: Match, rawSearch: string) {
  const search = normalizeSearch(rawSearch);
  if (!search) return true;
  const groupLetter = groupLetterFromMatch(match);
  const groupQuery = search.match(/^(?:group|grupo|groupe)\s+([a-l])$/);
  if (groupQuery) return groupLetter === groupQuery[1];
  if (/^[a-l]$/.test(search)) return groupLetter === search;
  const tokens = search.split(' ').filter(Boolean);
  if (tokens.includes('group') || tokens.includes('grupo') || tokens.includes('groupe')) {
    const letter = tokens.find((token) => /^[a-l]$/.test(token));
    if (letter) return groupLetter === letter;
  }
  const text = normalizeSearch(matchSearchText(match));
  return tokens.every((token) => text.includes(token));
}

function viewSpecificSearchText(match: Match, view: FixtureView, locale: Locale) {
  if (view === 'date') return `${match.date} ${match.time} ${formatMatchSchedule(match, locale).local}`;
  if (view === 'group') return `${match.group} ${groupLetterFromMatch(match)} group ${groupLetterFromMatch(match)} grupo ${groupLetterFromMatch(match)}`;
  if (view === 'team') return `${match.home} ${match.away} ${match.homeFlag} ${match.awayFlag}`;
  if (view === 'city') return match.city;
  if (view === 'venue') return match.venue;
  return phaseAliases(match.group).join(' ');
}

function matchesFixtureDetail(match: Match, view: FixtureView, rawSearch: string, locale: Locale) {
  const search = normalizeSearch(rawSearch);
  if (!search) return true;
  if (view === 'group') {
    const letter = groupLetterFromMatch(match);
    const groupQuery = search.match(/^(?:group|grupo|groupe)?\s*([a-l])$/);
    return groupQuery ? letter === groupQuery[1] : normalizeSearch(match.group).includes(search);
  }
  if (view === 'phase') {
    return phaseAliases(match.group).some((alias) => normalizeSearch(alias).includes(search) || search.includes(normalizeSearch(alias)));
  }
  return normalizeSearch(viewSpecificSearchText(match, view, locale)).includes(search);
}

function matchWinner(match: Match) {
  if (match.homeScore === null || match.awayScore === null) return null;
  if (match.homeScore === match.awayScore) return 'TBD';
  return match.homeScore > match.awayScore ? match.homeFlag : match.awayFlag;
}

function matchStatusLabel(match: Match) {
  if (match.homeScore === null || match.awayScore === null) return match.status === 'scheduled' || !match.status ? 'TBD' : match.status;
  return `${match.homeScore}-${match.awayScore}`;
}

function canEditPrediction(match: Match) {
  if (match.homeScore !== null || match.awayScore !== null || match.status === 'final') return false;
  if (!match.kickoffUtc) return true;
  const kickoff = new Date(match.kickoffUtc);
  if (Number.isNaN(kickoff.getTime())) return true;
  return kickoff.getTime() > Date.now();
}

function knockoutMatches(matches: Match[], from: number, to: number) {
  return matches.filter((match) => match.id >= from && match.id <= to).sort((a, b) => a.id - b.id);
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
    status: String(row.status || 'scheduled'),
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
    city: String(row.campaign_city || row.city || row.merchant_city || ''),
    zone: String(row.zone || ''),
    address: String(row.address || ''),
    offer: String(row.prize || ''),
    rule: String(row.rule || 'participate') as CouponRule,
    quantity: Number(row.quantity || 0),
    link: String(row.link || '#'),
    instagram: String(row.instagram_url || ''),
    facebook: String(row.facebook_url || ''),
    tiktok: String(row.tiktok_url || ''),
    whatsapp: String(row.whatsapp_url || ''),
    image: String(row.image_url || '/world-cup-abstract-bg.png'),
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
  const [promoCityFilter, setPromoCityFilter] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [account, setAccount] = useState<Account | null>(null);
  const [authMessage, setAuthMessage] = useState('');

  useEffect(() => {
    setAccount(readAccount());
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
  const selectedPrediction = activeFan ? myPredictions.find((prediction) => prediction.matchId === selectedMatch.id) : undefined;
  const filteredMatches = useMemo(() => {
    return matches.filter((match) => matchesFixtureDetail(match, fixtureView, fixtureFilter, locale));
  }, [fixtureFilter, fixtureView, locale, matches]);
  const fixtureGroups = useMemo(() => {
    const groups = new Map<string, Match[]>();
    filteredMatches.forEach((match) => {
      const key = fixtureKey(match, fixtureView, locale);
      groups.set(key, [...(groups.get(key) || []), match]);
    });
    return [...groups.entries()];
  }, [filteredMatches, fixtureView, locale]);
  const promoCities = useMemo(() => {
    return [...new Set(coupons.map((coupon) => coupon.city).filter(Boolean))].sort();
  }, [coupons]);
  const filteredCoupons = useMemo(() => {
    const needle = promoCityFilter.trim().toLowerCase();
    if (!needle) return coupons;
    return coupons.filter((coupon) => [coupon.city, coupon.zone, coupon.merchant].some((value) => value.toLowerCase().includes(needle)));
  }, [coupons, promoCityFilter]);
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
    if (!account || account.role !== 'fan') {
      setAuthMessage('Registrate o inicia sesion para guardar tu marcador.');
      return;
    }
    if (!canEditPrediction(selectedMatch)) {
      setAuthMessage('Este partido ya empezo o tiene resultado cargado. La prediccion ya no se puede editar.');
      return;
    }
    let userId = Number(formData.get('userId'));
    if (formData.get('userId') === 'new') {
      const name = String(formData.get('name') || account.name || 'Fan');
      const id = Date.now();
      const fallbackFan = {
        id,
        name,
        handle: `${name.slice(0, 3).toUpperCase()}-${String(id).slice(-3)}`,
        contact: String(formData.get('contact') || account.email || ''),
        channel: 'whatsapp' as const,
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

  function selectMatchForPrediction(matchId: number) {
    setTab('matches');
    setSelectedMatchId(matchId);
    window.setTimeout(() => {
      document.getElementById('predict')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  }

  async function authenticateFan(formData: FormData) {
    const mode = String(formData.get('mode') || 'login');
    setAuthMessage('Conectando tu cuenta...');
    try {
      const payload = {
        role: 'fan',
        name: String(formData.get('email') || 'Fan'),
        email: String(formData.get('email') || '').trim().toLowerCase(),
        password: String(formData.get('password') || ''),
        city: String(formData.get('city') || ''),
      };
      const nextAccount = await apiFetch<Account>(`/api/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (nextAccount.role !== 'fan') {
        setAuthMessage('Esta cuenta no es de usuario apostador.');
        return;
      }
      saveAccount(nextAccount);
      setAccount(nextAccount);
      setAuthMessage('Listo. Ya puedes guardar tu prediccion.');
    } catch {
      setAuthMessage('No se pudo entrar. Revisa email y password, o crea una cuenta nueva.');
    }
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

      <SponsorRibbon coupons={coupons} setTab={setTab} />

      <main className="mx-auto max-w-7xl px-4 py-8">
        {account?.role === 'fan' && (
          <div className="mb-5 rounded-lg border border-emerald-300/25 bg-emerald-300/10 p-4">
            <p className="text-sm font-black text-emerald-200">Welcome, {account.email}</p>
          </div>
        )}
        <div className="tab-strip sticky top-[65px] z-30 mb-6 grid grid-cols-2 gap-2 rounded-lg border border-white/10 p-2 backdrop-blur-xl md:grid-cols-5">
          {(['matches', 'bracket', 'predictions', 'vouchers', 'promos'] as Tab[]).map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`h-12 rounded-md text-sm font-black transition ${tab === item ? 'bg-amber-300 text-slate-950 shadow-[0_10px_28px_rgba(247,201,72,0.18)]' : 'text-slate-200 hover:bg-white/10'}`}
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
                    <option value="phase">{t.phase}</option>
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
                          onClick={() => selectMatchForPrediction(match.id)}
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
              existingPrediction={selectedPrediction}
              account={account}
              authMessage={authMessage}
              authenticateFan={authenticateFan}
            />
          </section>
        )}

        {tab === 'bracket' && (
          <KnockoutBracket
            matches={matches}
            selectedMatchId={selectedMatchId}
            setSelectedMatchId={setSelectedMatchId}
            locale={locale}
            t={t}
          />
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
                    {match && canEditPrediction(match) && (
                      <button
                        type="button"
                        onClick={() => selectMatchForPrediction(match.id)}
                        className="mt-4 rounded-md bg-white px-4 py-2 text-sm font-black text-slate-950"
                      >
                        Modificar prediccion
                      </button>
                    )}
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
          <section id="promos" className="grid gap-5">
            <div className="glass-panel rounded-lg p-5">
              <SectionTitle title={t.promos} helper="Find campaigns by any city or commercial market. They do not need to be World Cup host cities." />
              <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
                <input
                  value={promoCityFilter}
                  onChange={(event) => setPromoCityFilter(event.target.value)}
                  placeholder="Buscar ciudad, zona o local"
                  className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-amber-300"
                />
                <div className="flex flex-wrap gap-2">
                  {promoCities.slice(0, 8).map((city) => (
                    <button key={city} type="button" onClick={() => setPromoCityFilter(city)} className="rounded-md bg-white/10 px-3 py-2 text-sm font-black text-slate-100">
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {filteredCoupons.map((coupon) => (
              <article key={coupon.id} className="promo-ticket rounded-lg">
                <img src={coupon.image} alt={coupon.offer} className="h-36 w-full rounded-t-lg object-cover" />
                <div className="p-4">
                  <span className="rounded-full bg-amber-300 px-2 py-1 text-xs font-black text-slate-950">{coupon.level}</span>
                  <h3 className="mt-4 text-xl font-black">{coupon.offer}</h3>
                  <p className="mt-2 text-sm text-slate-300">{coupon.merchant}</p>
                  <p className="mt-1 text-sm font-bold text-emerald-200">{coupon.city}</p>
                  <p className="mt-1 text-sm text-slate-400">{coupon.zone}</p>
                  <p className="mt-1 text-xs text-slate-500">{coupon.address}</p>
                  <p className="mt-3 text-xs text-amber-200">{coupon.quantity} {t.available}</p>
                  <SocialLinks links={[coupon.link, coupon.instagram, coupon.facebook, coupon.tiktok, coupon.whatsapp]} label={t.go} />
                </div>
              </article>
            ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function SocialLinks({ links, label }: { links: string[]; label: string }) {
  const cleanLinks = links.filter(Boolean);
  if (cleanLinks.length === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {cleanLinks.map((link, index) => (
        <a key={`${link}-${index}`} href={link} target="_blank" rel="noreferrer" className="rounded-md bg-white px-3 py-2 text-xs font-black text-slate-950">
          {index === 0 ? label : `Red ${index}`}
        </a>
      ))}
    </div>
  );
}

function SponsorRibbon({ coupons, setTab }: { coupons: Coupon[]; setTab: (tab: Tab) => void }) {
  const items = coupons.length > 0 ? coupons : couponsSeed;
  const ribbonItems = [...items, ...items].slice(0, Math.max(8, items.length * 2));
  return (
    <section className="border-y border-white/10 bg-slate-950/80 py-3">
      <div className="mx-auto max-w-7xl px-4">
        <div className="sponsor-marquee overflow-hidden">
          <div className="sponsor-item flex w-max gap-3">
            {ribbonItems.map((coupon, index) => (
              <button
                key={`${coupon.id}-${index}`}
                type="button"
                onClick={() => setTab('promos')}
                className="flex h-20 w-[300px] items-center gap-3 rounded-lg border border-white/10 bg-white/10 p-2 text-left transition hover:border-amber-300/60"
              >
                <img src={coupon.image} alt={coupon.merchant} className="h-14 w-16 rounded-md object-cover" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black text-white">{coupon.merchant}</span>
                  <span className="block truncate text-xs text-amber-200">{coupon.offer}</span>
                  <span className="block truncate text-xs text-slate-400">{coupon.city || coupon.zone}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
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
  existingPrediction,
  account,
  authMessage,
  authenticateFan,
}: {
  id?: string;
  t: Record<string, string>;
  match: Match;
  fans: Fan[];
  selectedFanId: number | 'new';
  setSelectedFanId: (id: number | 'new') => void;
  deviceId: string;
  savePrediction: (formData: FormData) => void | Promise<void>;
  existingPrediction?: Prediction;
  account: Account | null;
  authMessage: string;
  authenticateFan: (formData: FormData) => void | Promise<void>;
}) {
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const editable = canEditPrediction(match);

  useEffect(() => {
    setHomeScore(existingPrediction?.homeScore ?? 0);
    setAwayScore(existingPrediction?.awayScore ?? 0);
  }, [match.id, existingPrediction?.homeScore, existingPrediction?.awayScore]);

  return (
    <section id={id} className="glass-panel rounded-lg p-5">
      <SectionTitle title={t.play} helper={`${match.homeFlag} ${match.home} vs ${match.awayFlag} ${match.away}`} />
      {existingPrediction && (
        <p className="mt-3 rounded-md bg-amber-300/10 p-3 text-sm font-bold text-amber-100">
          Ya guardaste {existingPrediction.homeScore}-{existingPrediction.awayScore}. Puedes modificarla hasta antes del inicio del partido.
        </p>
      )}
      {!editable && (
        <p className="mt-3 rounded-md bg-rose-400/15 p-3 text-sm font-bold text-rose-100">
          Predicciones cerradas para este partido.
        </p>
      )}
      {(!account || account.role !== 'fan') && (
        <FanAuthGate authenticateFan={authenticateFan} message={authMessage} />
      )}
      <form action={savePrediction} className="mt-5 grid gap-4">
        <input type="hidden" name="matchId" value={match.id} />
        <input type="hidden" name="userId" value={selectedFanId} />
        <input type="hidden" name="homeScore" value={homeScore} />
        <input type="hidden" name="awayScore" value={awayScore} />
        {account && account.role === 'fan' && (
          <div className="fan-card grid gap-3 rounded-lg border border-amber-300/20 p-4">
            <div className="rounded-md border border-white/10 bg-slate-950/80 p-3">
              <span className="text-xs uppercase tracking-[0.18em] text-amber-300">Cuenta activa</span>
              <strong className="mt-1 block text-lg">Welcome, {account.email}</strong>
              <span className="mt-1 block text-xs text-slate-400">{t.device}: {deviceId || 'Generating...'}</span>
            </div>
            <input type="hidden" name="name" value={account.email} />
            <input type="hidden" name="contact" value={account.email} />
            {fans.length > 1 && (
              <label className="grid gap-2 text-sm font-semibold text-slate-300">
                {t.selectFan}
                <select
                  value={selectedFanId}
                  onChange={(event) => setSelectedFanId(event.target.value === 'new' ? 'new' : Number(event.target.value))}
                  className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-amber-300"
                >
                  {fans.map((fan) => <option key={fan.id} value={fan.id}>{fan.name} - {fan.handle}</option>)}
                  <option value="new">{t.newFan}</option>
                </select>
              </label>
            )}
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <ScoreStepper label={match.home} code={match.homeFlag} value={homeScore} setValue={setHomeScore} />
          <div className="hidden text-center text-3xl font-black text-amber-300 sm:block">:</div>
          <ScoreStepper label={match.away} code={match.awayFlag} value={awayScore} setValue={setAwayScore} />
        </div>
        <button disabled={!account || account.role !== 'fan' || !editable} className="fantasy-button h-12 rounded-md font-black transition disabled:cursor-not-allowed disabled:opacity-45">
          {existingPrediction ? 'Modificar prediccion' : t.save}
        </button>
      </form>
    </section>
  );
}

function FanAuthGate({ authenticateFan, message }: { authenticateFan: (formData: FormData) => void | Promise<void>; message: string }) {
  return (
    <div className="mt-5 rounded-lg border border-amber-300/25 bg-slate-950/75 p-4">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-300">Registro para guardar</p>
      <p className="mt-2 text-sm text-slate-300">Puedes mirar fixture y promos libremente. Para guardar tu marcador necesitamos identificarte.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <a href={`${API_URL}/api/auth/oauth/google/start`} className="h-11 rounded-md bg-white px-4 py-3 text-center text-sm font-black text-slate-950">
          Continue with Google
        </a>
        <a href={`${API_URL}/api/auth/oauth/facebook/start`} className="h-11 rounded-md bg-[#1877f2] px-4 py-3 text-center text-sm font-black text-white">
          Continue with Facebook
        </a>
      </div>
      <form action={authenticateFan} className="mt-4 grid gap-3 md:grid-cols-[0.75fr_1fr_1fr_auto]">
        <select name="mode" className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-amber-300">
          <option value="login">Login</option>
          <option value="register">Registro</option>
        </select>
        <input name="email" type="email" placeholder="Email" className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-amber-300" required />
        <input name="password" type="password" placeholder="Password" className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-amber-300" required />
        <button className="h-11 rounded-md bg-white px-4 font-black text-slate-950" type="submit">Entrar</button>
      </form>
      {message && <p className="mt-3 rounded-md bg-white/10 p-3 text-sm text-slate-200">{message}</p>}
    </div>
  );
}

function ScoreStepper({ label, code, value, setValue }: { label: string; code: string; value: number; setValue: (value: number) => void }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="rounded bg-white px-2 py-1 text-xs font-black text-slate-950">{code}</span>
          <strong className="mt-2 block truncate text-lg">{label}</strong>
        </div>
        <strong className="text-5xl font-black tabular-nums text-amber-300">{value}</strong>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setValue(Math.max(0, value - 1))} className="h-11 rounded-md bg-white/10 text-2xl font-black text-white transition hover:bg-white/20">-</button>
        <button type="button" onClick={() => setValue(Math.min(15, value + 1))} className="h-11 rounded-md bg-white text-2xl font-black text-slate-950 transition hover:bg-amber-300">+</button>
      </div>
    </div>
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

function KnockoutBracket({
  matches,
  selectedMatchId,
  setSelectedMatchId,
  locale,
  t,
}: {
  matches: Match[];
  selectedMatchId: number;
  setSelectedMatchId: (id: number) => void;
  locale: Locale;
  t: Record<string, string>;
}) {
  const round32 = knockoutMatches(matches, 73, 88);
  const r16 = knockoutMatches(matches, 89, 96);
  const qf = knockoutMatches(matches, 97, 100);
  const sf = knockoutMatches(matches, 101, 102);
  const bronze = matches.find((match) => match.id === 103);
  const final = matches.find((match) => match.id === 104);

  return (
    <section className="glass-panel rounded-lg p-5">
      <SectionTitle title={t.bracket} helper={t.bracketHelper} />
      <div className="bracket-board mt-6 overflow-x-auto rounded-lg border border-white/10 p-4 pb-5">
        <div className="grid min-w-[1180px] grid-cols-[1.1fr_1fr_0.95fr_0.9fr_1.1fr_0.9fr_0.95fr_1fr_1.1fr] gap-4">
          <BracketColumn title="Round of 32" matches={round32.slice(0, 8)} selectedMatchId={selectedMatchId} setSelectedMatchId={setSelectedMatchId} locale={locale} />
          <BracketColumn title="Round of 16" matches={r16.slice(0, 4)} selectedMatchId={selectedMatchId} setSelectedMatchId={setSelectedMatchId} locale={locale} spaced />
          <BracketColumn title="Quarter-finals" matches={qf.slice(0, 2)} selectedMatchId={selectedMatchId} setSelectedMatchId={setSelectedMatchId} locale={locale} spaced />
          <BracketColumn title="Semi-finals" matches={sf.slice(0, 1)} selectedMatchId={selectedMatchId} setSelectedMatchId={setSelectedMatchId} locale={locale} center />
          <div className="grid content-center gap-4">
            <p className="text-center text-xs font-black uppercase tracking-[0.2em] text-amber-300">Final</p>
            {final && <BracketMatch match={final} selected={selectedMatchId === final.id} setSelectedMatchId={setSelectedMatchId} locale={locale} featured />}
            {bronze && (
              <div>
                <p className="mb-2 text-center text-xs font-black uppercase tracking-[0.2em] text-slate-400">{t.thirdPlace}</p>
                <BracketMatch match={bronze} selected={selectedMatchId === bronze.id} setSelectedMatchId={setSelectedMatchId} locale={locale} />
              </div>
            )}
          </div>
          <BracketColumn title="Semi-finals" matches={sf.slice(1, 2)} selectedMatchId={selectedMatchId} setSelectedMatchId={setSelectedMatchId} locale={locale} center reverse />
          <BracketColumn title="Quarter-finals" matches={qf.slice(2, 4)} selectedMatchId={selectedMatchId} setSelectedMatchId={setSelectedMatchId} locale={locale} spaced reverse />
          <BracketColumn title="Round of 16" matches={r16.slice(4, 8)} selectedMatchId={selectedMatchId} setSelectedMatchId={setSelectedMatchId} locale={locale} spaced reverse />
          <BracketColumn title="Round of 32" matches={round32.slice(8, 16)} selectedMatchId={selectedMatchId} setSelectedMatchId={setSelectedMatchId} locale={locale} reverse />
        </div>
      </div>
    </section>
  );
}

function BracketColumn({
  title,
  matches,
  selectedMatchId,
  setSelectedMatchId,
  locale,
  spaced = false,
  center = false,
  reverse = false,
}: {
  title: string;
  matches: Match[];
  selectedMatchId: number;
  setSelectedMatchId: (id: number) => void;
  locale: Locale;
  spaced?: boolean;
  center?: boolean;
  reverse?: boolean;
}) {
  return (
    <div className={`grid gap-3 ${spaced ? 'content-around' : 'content-start'} ${center ? 'content-center' : ''}`}>
      <p className="text-center text-xs font-black uppercase tracking-[0.2em] text-amber-300">{title}</p>
      {matches.map((match) => (
        <BracketMatch
          key={match.id}
          match={match}
          selected={selectedMatchId === match.id}
          setSelectedMatchId={setSelectedMatchId}
          locale={locale}
          reverse={reverse}
        />
      ))}
    </div>
  );
}

function BracketMatch({
  match,
  selected,
  setSelectedMatchId,
  locale,
  featured = false,
  reverse = false,
}: {
  match: Match;
  selected: boolean;
  setSelectedMatchId: (id: number) => void;
  locale: Locale;
  featured?: boolean;
  reverse?: boolean;
}) {
  const schedule = formatMatchSchedule(match, locale);
  const winner = matchWinner(match);
  return (
    <button
      type="button"
      onClick={() => setSelectedMatchId(match.id)}
      className={`fixture-card bracket-match ${reverse ? 'bracket-match-left' : ''} relative w-full rounded-lg border p-3 text-left transition ${selected ? 'border-amber-300 shadow-[0_0_0_1px_rgba(247,201,72,0.35),0_18px_38px_rgba(247,201,72,0.12)]' : 'border-white/10 hover:border-amber-300/60'} ${featured ? 'bg-amber-300/10' : ''}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-black text-slate-400">M{match.id}</span>
        <span className="rounded bg-white/10 px-2 py-1 text-[11px] font-black uppercase text-slate-300">{matchStatusLabel(match)}</span>
      </div>
      <BracketTeam code={match.homeFlag} name={match.home} score={match.homeScore} winner={winner === match.homeFlag} />
      <BracketTeam code={match.awayFlag} name={match.away} score={match.awayScore} winner={winner === match.awayFlag} />
      <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-slate-500">{schedule.local} · {match.city}</p>
    </button>
  );
}

function BracketTeam({ code, name, score, winner }: { code: string; name: string; score: number | null; winner: boolean }) {
  return (
    <div className={`mt-1 grid grid-cols-[42px_1fr_auto] items-center gap-2 rounded-md px-2 py-1 ${winner ? 'bg-emerald-300/20 text-white' : 'bg-white/5 text-slate-300'}`}>
      <span className="text-xs font-black">{code}</span>
      <span className="truncate text-sm font-bold">{name}</span>
      <span className="text-sm font-black tabular-nums">{score ?? '-'}</span>
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
