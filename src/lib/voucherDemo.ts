export type VoucherStatus = 'valid' | 'used' | 'expired';

export type VoucherRecord = {
  code: string;
  fan: string;
  fanId: string;
  merchant: string;
  offer: string;
  match: string;
  issuedAt: string;
  status: VoucherStatus;
};

export const demoVouchers: VoucherRecord[] = [
  {
    code: 'BOLI-ANA-1',
    fan: 'Ana Torres',
    fanId: 'ANA-204',
    merchant: 'Boliche La Final',
    offer: '2x1 en entrada antes de medianoche',
    match: 'MEX Mexico 2-1 RSA South Africa',
    issuedAt: '2026-06-11 22:18',
    status: 'valid',
  },
  {
    code: 'AFTE-DIE-4',
    fan: 'Diego Paz',
    fanId: 'DIE-330',
    merchant: 'After Match Club',
    offer: '15% off en lista VIP',
    match: 'ARG Argentina 3-1 ALG Algeria',
    issuedAt: '2026-06-16 23:04',
    status: 'valid',
  },
  {
    code: 'FANZ-MAJ-3',
    fan: 'Majo Silva',
    fanId: 'MAJ-771',
    merchant: 'Fan Zone Burger',
    offer: 'Papas gratis con cualquier combo',
    match: 'BRA Brazil 1-1 MAR Morocco',
    issuedAt: '2026-06-13 20:40',
    status: 'used',
  },
];

export const demoMerchants = [
  {
    name: 'Boliche La Final',
    city: 'La Paz',
    zone: 'Tlalpan / Azteca',
    address: 'Calz. de Tlalpan 3465, Santa Ursula Coapa',
    link: 'https://maps.google.com/?q=Estadio+Azteca',
    instagram: '',
    facebook: '',
    tiktok: '',
    whatsapp: '',
    image: '/world-cup-abstract-bg.png',
    offer: '2x1 en entrada antes de medianoche',
    rule: 'Marcador exacto',
  },
  {
    name: 'Terraza Gol Norte',
    city: 'Guadalajara',
    zone: 'Guadalajara',
    address: 'Av. Circuito JVC 2800, Zapopan',
    link: 'https://maps.google.com/?q=Estadio+Akron',
    instagram: '',
    facebook: '',
    tiktok: '',
    whatsapp: '',
    image: '/world-cup-abstract-bg.png',
    offer: 'Bucket 3x2 para mesa mundialista',
    rule: 'Acertar ganador',
  },
];
