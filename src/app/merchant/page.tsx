'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import VoucherQr from '@/components/VoucherQr';
import { demoVouchers } from '@/lib/voucherDemo';
import { readAccount, saveAccount, type Account } from '@/lib/account';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://bet2back-production.up.railway.app';

type RewardRule = 'winner' | 'exact' | 'goal_diff' | 'home_goals' | 'away_goals' | 'first_half_goals' | 'participate';

type MerchantReward = {
  id: number;
  merchantId?: number;
  title: string;
  prize: string;
  rule: RewardRule;
  quantity: number;
  expires: string;
  image: string;
  city: string;
  reviewStatus?: string;
};

type VisitPromo = {
  id: number;
  merchantId?: number;
  title: string;
  description: string;
  image: string;
  link: string;
  city: string;
  address: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  whatsapp: string;
  expires: string;
  reviewStatus?: string;
};

type ApiVoucher = {
  code: string;
  status: string;
  fan_name: string;
  handle: string;
  prize: string;
  title: string;
  merchant_name: string;
  home_team: string;
  away_team: string;
  home_code: string;
  away_code: string;
  issued_at: string;
};

type DetectorCtor = new (options?: { formats?: string[] }) => {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
};

export default function MerchantVerifyPage() {
  const [code, setCode] = useState('');
  const [usedCodes, setUsedCodes] = useState<string[]>([]);
  const [cameraMessage, setCameraMessage] = useState('');
  const [apiVoucher, setApiVoucher] = useState<ApiVoucher | null>(null);
  const [verifyError, setVerifyError] = useState('');
  const [rewards, setRewards] = useState<MerchantReward[]>([
    { id: 1, title: 'Exact score night', prize: '2x1 en entrada antes de medianoche', rule: 'exact', quantity: 80, expires: '12 Jun 23:59', image: '/world-cup-abstract-bg.png', city: 'Mexico City' },
    { id: 2, title: 'Winner pick promo', prize: 'Shot de bienvenida para mesa mundialista', rule: 'winner', quantity: 120, expires: '30 Jun 23:59', image: '/world-cup-abstract-bg.png', city: 'Guadalajara' },
  ]);
  const [visitPromos, setVisitPromos] = useState<VisitPromo[]>([
    { id: 1, title: 'Happy hour mundialista', description: '10% off mostrando la app en barra.', image: '/world-cup-abstract-bg.png', link: 'https://maps.google.com', city: 'Mexico City', address: 'Zona estadio', instagram: '', facebook: '', tiktok: '', whatsapp: '', expires: 'Durante partidos' },
  ]);
  const [account, setAccount] = useState<Account | null>(null);
  const [authMessage, setAuthMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const voucher = useMemo(() => {
    return demoVouchers.find((item) => item.code.toLowerCase() === code.trim().toLowerCase());
  }, [code]);

  const effectiveStatus = voucher && usedCodes.includes(voucher.code) ? 'used' : voucher?.status;
  const isValid = voucher && effectiveStatus === 'valid';
  const displayedStatus = apiVoucher?.status || effectiveStatus;
  const displayedIsValid = apiVoucher ? apiVoucher.status === 'valid' : isValid;
  const visibleRewards = useMemo(() => (
    account?.merchant_id ? rewards.filter((reward) => !reward.merchantId || reward.merchantId === account.merchant_id) : rewards
  ), [account?.merchant_id, rewards]);
  const visiblePromos = useMemo(() => (
    account?.merchant_id ? visitPromos.filter((promo) => !promo.merchantId || promo.merchantId === account.merchant_id) : visitPromos
  ), [account?.merchant_id, visitPromos]);

  useEffect(() => {
    setAccount(readAccount());

    fetch(`${API_URL}/api/merchant-rewards?include_all=1`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((rows) => setRewards(rows.map((row: Record<string, unknown>) => ({
        id: Number(row.id),
        merchantId: Number(row.merchant_id || 0),
        title: String(row.title || ''),
        prize: String(row.prize || ''),
        rule: String(row.rule || 'participate') as RewardRule,
        quantity: Number(row.quantity || 0),
        expires: String(row.expires_at || ''),
        image: String(row.image_url || '/world-cup-abstract-bg.png'),
        city: String(row.campaign_city || row.city || row.merchant_city || ''),
        reviewStatus: String(row.review_status || 'approved'),
      }))))
      .catch(() => undefined);

    fetch(`${API_URL}/api/merchant-promotions?include_all=1`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((rows) => setVisitPromos(rows.map((row: Record<string, unknown>) => ({
        id: Number(row.id),
        merchantId: Number(row.merchant_id || 0),
        title: String(row.title || ''),
        description: String(row.description || ''),
        image: String(row.image_url || '/world-cup-abstract-bg.png'),
        link: String(row.link || '#'),
        city: String(row.campaign_city || row.city || row.merchant_city || ''),
        address: String(row.campaign_address || row.address || ''),
        instagram: String(row.campaign_instagram_url || row.instagram_url || ''),
        facebook: String(row.campaign_facebook_url || row.facebook_url || ''),
        tiktok: String(row.campaign_tiktok_url || row.tiktok_url || ''),
        whatsapp: String(row.campaign_whatsapp_url || row.whatsapp_url || ''),
        expires: String(row.expires_at || ''),
        reviewStatus: String(row.review_status || 'approved'),
      }))))
      .catch(() => undefined);
  }, []);

  async function authenticateMerchant(formData: FormData) {
    const mode = String(formData.get('mode') || 'login');
    setAuthMessage('Conectando el local...');
    try {
      const nextAccount = await fetch(`${API_URL}/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'merchant',
          name: String(formData.get('name') || formData.get('email') || 'Local aliado'),
          merchant_name: String(formData.get('merchant_name') || formData.get('name') || 'Local aliado'),
          email: String(formData.get('email') || '').trim().toLowerCase(),
          password: String(formData.get('password') || ''),
          city: String(formData.get('city') || ''),
        }),
      }).then((response) => response.ok ? response.json() : Promise.reject());
      if (nextAccount.role !== 'merchant') {
        setAuthMessage('Esta cuenta no corresponde a una empresa.');
        return;
      }
      saveAccount(nextAccount);
      setAccount(nextAccount);
      setAuthMessage('Listo. Ya puedes enviar campanas a revision.');
    } catch {
      setAuthMessage('No se pudo entrar. Revisa los datos o registra el local.');
    }
  }

  async function startScan() {
    const Detector = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
    if (!Detector) {
      setCameraMessage('QR scan is not supported in this browser. Enter the code manually.');
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    if (!videoRef.current) return;
    videoRef.current.srcObject = stream;
    await videoRef.current.play();

    const detector = new Detector({ formats: ['qr_code'] });
    const timer = window.setInterval(async () => {
      if (!videoRef.current) return;
      const results = await detector.detect(videoRef.current);
      const rawValue = results[0]?.rawValue;
      if (rawValue) {
        setCode(rawValue);
        verifyCode(rawValue);
        setCameraMessage('QR detected.');
        window.clearInterval(timer);
        stream.getTracks().forEach((track) => track.stop());
      }
    }, 700);
  }

  function markUsed() {
    if (apiVoucher) {
      fetch(`${API_URL}/api/vouchers/${encodeURIComponent(apiVoucher.code)}/redeem`, { method: 'POST' })
        .then(() => setApiVoucher((current) => current ? { ...current, status: 'used' } : current))
        .catch(() => undefined);
      return;
    }
    if (voucher) setUsedCodes((current) => [...new Set([...current, voucher.code])]);
  }

  function verifyCode(nextCode = code) {
    setVerifyError('');
    setApiVoucher(null);
    fetch(`${API_URL}/api/vouchers/${encodeURIComponent(nextCode.trim())}`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(setApiVoucher)
      .catch(() => setVerifyError('Vale no encontrado en backend. Revisa el código o usa datos demo.'));
  }

  async function uploadImage(formData: FormData, folder: string) {
    const file = formData.get('image');
    if (!(file instanceof File) || file.size === 0) return '/world-cup-abstract-bg.png';

    const uploadData = new FormData();
    uploadData.append('image', file);
    uploadData.append('folder', folder);
    const response = await fetch(`${API_URL}/api/uploads/images`, {
      method: 'POST',
      body: uploadData,
    });
    if (!response.ok) throw new Error('Image upload failed');
    const payload = await response.json();
    return String(payload.url || '/world-cup-abstract-bg.png');
  }

  async function addReward(formData: FormData) {
    const image = await uploadImage(formData, 'merchant-rewards').catch(() => '/world-cup-abstract-bg.png');
    fetch(`${API_URL}/api/merchant-rewards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: account?.merchant_id || 1,
        title: String(formData.get('title') || 'Nueva promo'),
        prize: String(formData.get('prize') || 'Premio especial'),
        rule: String(formData.get('rule')),
        quantity: Number(formData.get('quantity') || 50),
        city: String(formData.get('city') || ''),
        expires_at: String(formData.get('expires') || 'Durante el mundial'),
        image_url: image,
        review_status: 'pending_review',
      }),
    }).catch(() => undefined);
    setRewards((current) => [{
      id: Date.now(),
      merchantId: account?.merchant_id || 1,
      title: String(formData.get('title') || 'Nueva promo'),
      prize: String(formData.get('prize') || 'Premio especial'),
      rule: String(formData.get('rule')) as RewardRule,
      quantity: Number(formData.get('quantity') || 50),
      expires: String(formData.get('expires') || 'Durante el mundial'),
      image,
      city: String(formData.get('city') || ''),
      reviewStatus: 'pending_review',
    }, ...current]);
  }

  async function addVisitPromo(formData: FormData) {
    const image = await uploadImage(formData, 'merchant-promotions').catch(() => '/world-cup-abstract-bg.png');
    fetch(`${API_URL}/api/merchant-promotions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: account?.merchant_id || 1,
        title: String(formData.get('title') || 'Promo por visita'),
        description: String(formData.get('description') || 'Beneficio mostrando la app'),
        image_url: image,
        city: String(formData.get('city') || ''),
        address: String(formData.get('address') || ''),
        link: String(formData.get('link') || 'https://maps.google.com'),
        instagram_url: String(formData.get('instagram') || ''),
        facebook_url: String(formData.get('facebook') || ''),
        tiktok_url: String(formData.get('tiktok') || ''),
        whatsapp_url: String(formData.get('whatsapp') || ''),
        expires_at: String(formData.get('expires') || 'Durante el mundial'),
        review_status: 'pending_review',
      }),
    }).catch(() => undefined);
    setVisitPromos((current) => [{
      id: Date.now(),
      merchantId: account?.merchant_id || 1,
      title: String(formData.get('title') || 'Promo por visita'),
      description: String(formData.get('description') || 'Beneficio mostrando la app'),
      image,
      link: String(formData.get('link') || 'https://maps.google.com'),
      city: String(formData.get('city') || ''),
      address: String(formData.get('address') || ''),
      instagram: String(formData.get('instagram') || ''),
      facebook: String(formData.get('facebook') || ''),
      tiktok: String(formData.get('tiktok') || ''),
      whatsapp: String(formData.get('whatsapp') || ''),
      expires: String(formData.get('expires') || 'Durante el mundial'),
      reviewStatus: 'pending_review',
    }, ...current]);
  }

  return (
    <div className="stadium-surface min-h-screen px-4 py-10 text-white">
      <div className="mx-auto grid max-w-7xl gap-6">
        <section className="glass-panel overflow-hidden rounded-lg p-5 md:p-7">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">Merchant cockpit</p>
              <h1 className="mt-2 max-w-3xl text-4xl font-black leading-tight md:text-5xl">Premios, promos y validacion QR en un solo panel.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                El local publica beneficios por acierto, carga promos abiertas por visita, segmenta por ciudad o zona comercial y verifica cada vale con codigo o QR.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:w-[360px]">
              <MerchantStat value={String(rewards.length)} label="premios" />
              <MerchantStat value={String(visitPromos.length)} label="promos" />
              <MerchantStat value={usedCodes.length ? String(usedCodes.length) : 'QR'} label="canje" />
            </div>
          </div>
        </section>

        {(!account || account.role !== 'merchant') && (
          <MerchantAuthGate authenticateMerchant={authenticateMerchant} message={authMessage} />
        )}

        {account?.role === 'merchant' && (
        <>

        <section id="rewards" className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="glass-panel rounded-lg p-5">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">Local rewards</p>
            <h1 className="mt-1 text-3xl font-black">Premios que entrega el local</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Cada local define que premio entrega y por que tipo de acierto: ganador, marcador exacto, diferencia de goles, goles de un equipo o goles del primer tiempo.
            </p>

            <form action={addReward} className="mt-6 grid gap-4">
              <Field name="title" label="Nombre de la campaña" placeholder="Noche de marcador exacto" />
              <Field name="prize" label="Premio / vale" placeholder="2x1 en entrada, bebida gratis, descuento..." />
              <Field name="city" label="Ciudad o mercado de la campaña" placeholder="La Paz, Bogotá, Lima, Miami..." />
              <FileField label="Foto del premio" />
              <label className="grid gap-2 text-sm font-semibold text-slate-300">
                Tipo de acierto
                <select name="rule" className="h-12 rounded-md border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-amber-300">
                  <option value="exact">Marcador exacto</option>
                  <option value="winner">Acertar ganador</option>
                  <option value="goal_diff">Acertar diferencia de goles</option>
                  <option value="home_goals">Acertar goles del local</option>
                  <option value="away_goals">Acertar goles del visitante</option>
                  <option value="first_half_goals">Acertar goles del primer tiempo</option>
                  <option value="participate">Solo participar</option>
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field name="quantity" label="Cantidad de vales" placeholder="100" type="number" />
                <Field name="expires" label="Vigencia" placeholder="30 Jun 23:59" />
              </div>
              <button className="fantasy-button h-12 rounded-md font-black transition">Enviar premio a revision</button>
            </form>
          </div>

          <div className="glass-panel rounded-lg p-5">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-300">Active campaigns</p>
            <h2 className="mt-1 text-3xl font-black">Premios publicados</h2>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {visibleRewards.map((reward) => (
                <article key={reward.id} className="promo-ticket rounded-lg p-4">
                  <img src={reward.image} alt={reward.title} className="mb-4 h-36 w-full rounded-md object-cover" />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="rounded-full bg-amber-300 px-2 py-1 text-xs font-black text-slate-950">{ruleLabel(reward.rule)}</span>
                      <h3 className="mt-4 text-xl font-black">{reward.title}</h3>
                      <p className="mt-2 text-slate-300">{reward.prize}</p>
                      {reward.city && <p className="mt-2 text-sm font-bold text-emerald-200">{reward.city}</p>}
                    </div>
                    <div className="rounded-md bg-white/10 px-3 py-2 text-right">
                      <strong className="text-2xl text-amber-300">{reward.quantity}</strong>
                      <p className="text-xs text-slate-400">vales</p>
                    </div>
                  </div>
                  <StatusBadge status={reward.reviewStatus} />
                  <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-400">Vigencia: {reward.expires}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="ads" className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="glass-panel rounded-lg p-5">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">Visit promos</p>
            <h2 className="mt-1 text-3xl font-black">Promos abiertas por visitar</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Estas promociones no dependen de acertar. Sirven como publicidad del local para atraer gente desde la app.
            </p>
            <form action={addVisitPromo} className="mt-6 grid gap-4">
              <Field name="title" label="Titulo de la promo" placeholder="Happy hour mundialista" />
              <Field name="description" label="En que consiste" placeholder="10% off mostrando la app" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field name="city" label="Ciudad o mercado" placeholder="La Paz, Bogotá, Lima, Miami..." />
                <Field name="address" label="Dirección textual" placeholder="Calle, número, zona" />
              </div>
              <FileField label="Foto o banner de la promo" />
              <Field name="link" label="Link principal / Maps" placeholder="Google Maps o web" />
              <div className="grid gap-3 sm:grid-cols-2">
                <OptionalField name="instagram" label="Instagram" placeholder="https://instagram.com/local" />
                <OptionalField name="facebook" label="Facebook" placeholder="https://facebook.com/local" />
                <OptionalField name="tiktok" label="TikTok" placeholder="https://tiktok.com/@local" />
                <OptionalField name="whatsapp" label="WhatsApp" placeholder="https://wa.me/..." />
              </div>
              <Field name="expires" label="Vigencia" placeholder="Durante partidos" />
              <button className="fantasy-button h-12 rounded-md font-black transition">Enviar promo a revision</button>
            </form>
          </div>

          <div className="glass-panel rounded-lg p-5">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-300">Public ads</p>
            <h2 className="mt-1 text-3xl font-black">Promos visibles para todos</h2>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {visiblePromos.map((promo) => (
                <article key={promo.id} className="promo-ticket rounded-lg">
                  <img src={promo.image} alt={promo.title} className="h-40 w-full rounded-t-lg object-cover" />
                  <div className="p-4">
                    <span className="rounded-full bg-emerald-300 px-2 py-1 text-xs font-black text-slate-950">Por visitar</span>
                    <h3 className="mt-4 text-xl font-black">{promo.title}</h3>
                    <p className="mt-2 text-slate-300">{promo.description}</p>
                    <p className="mt-2 text-sm font-bold text-emerald-200">{promo.city}</p>
                    <p className="mt-1 text-sm text-slate-400">{promo.address}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">Vigencia: {promo.expires}</p>
                    <StatusBadge status={promo.reviewStatus} />
                    <SocialLinks links={[promo.link, promo.instagram, promo.facebook, promo.tiktok, promo.whatsapp]} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="verify" className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="glass-panel rounded-lg p-5">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">Local verifier</p>
          <h1 className="mt-1 text-3xl font-black">Validate a voucher</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Scan the QR or enter the voucher code. The local should only redeem vouchers that return as valid.
          </p>

          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-slate-300">
              Voucher code
              <input
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  setApiVoucher(null);
                }}
                placeholder="BOLI-ANA-1"
                className="h-12 rounded-md border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-amber-300"
              />
            </label>
            <button onClick={startScan} className="fantasy-button h-12 rounded-md font-black transition" type="button">
              Scan QR with camera
            </button>
            <button onClick={() => verifyCode()} className="h-12 rounded-md bg-white font-black text-slate-950 transition" type="button">
              Verify code
            </button>
            {verifyError && <p className="rounded-md bg-rose-400/15 p-3 text-sm text-rose-100">{verifyError}</p>}
            {cameraMessage && <p className="rounded-md bg-white/10 p-3 text-sm text-slate-300">{cameraMessage}</p>}
            <video ref={videoRef} className="hidden rounded-lg border border-white/10" muted playsInline />
          </div>
        </section>

        <section className="glass-panel rounded-lg p-5">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-300">Authenticity result</p>
          {!voucher && !apiVoucher ? (
            <div className="mt-5 rounded-lg border border-dashed border-white/15 p-8 text-center text-slate-300">
              Enter or scan a voucher code to verify it.
            </div>
          ) : (
            <article className={`promo-ticket mt-5 rounded-lg p-5 ${displayedIsValid ? 'border-emerald-300/50' : 'border-rose-300/50'}`}>
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black text-slate-950 ${displayedIsValid ? 'bg-emerald-300' : 'bg-rose-300'}`}>
                    {displayedStatus?.toUpperCase()}
                  </span>
                  <h2 className="mt-4 text-3xl font-black">{apiVoucher?.prize || voucher?.offer}</h2>
                  <p className="mt-2 text-slate-300">{apiVoucher?.merchant_name || voucher?.merchant}</p>
                  <div className="mt-4 grid gap-2 text-sm text-slate-300">
                    <p><b className="text-white">Fan:</b> {apiVoucher ? `${apiVoucher.fan_name} (${apiVoucher.handle})` : `${voucher?.fan} (${voucher?.fanId})`}</p>
                    <p><b className="text-white">Match:</b> {apiVoucher ? `${apiVoucher.home_code} ${apiVoucher.home_team} vs ${apiVoucher.away_code} ${apiVoucher.away_team}` : voucher?.match}</p>
                    <p><b className="text-white">Issued:</b> {apiVoucher?.issued_at || voucher?.issuedAt}</p>
                  </div>
                </div>
                <VoucherQr value={apiVoucher?.code || voucher?.code || ''} />
              </div>
              <button
                onClick={markUsed}
                disabled={!displayedIsValid}
                className="mt-5 h-12 rounded-md bg-white px-5 font-black text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-40"
                type="button"
              >
                Mark as redeemed
              </button>
            </article>
          )}
        </section>
        </section>
        </>
        )}
      </div>
    </div>
  );
}

function MerchantAuthGate({ authenticateMerchant, message }: { authenticateMerchant: (formData: FormData) => void | Promise<void>; message: string }) {
  return (
    <section className="glass-panel rounded-lg p-5">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">Acceso de empresa</p>
      <h2 className="mt-1 text-3xl font-black">Entra para crear campanas y verificar vales.</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">Cada premio o publicidad queda pendiente hasta que admin revise que la promo sea real.</p>
      <form action={authenticateMerchant} className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-[0.7fr_1fr_1fr_1fr_1fr_auto]">
        <select name="mode" className="h-12 rounded-md border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-amber-300">
          <option value="login">Login</option>
          <option value="register">Registro</option>
        </select>
        <input name="merchant_name" placeholder="Nombre del local" className="h-12 rounded-md border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-amber-300" />
        <input name="city" placeholder="Ciudad" className="h-12 rounded-md border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-amber-300" />
        <input name="email" type="email" placeholder="Email" className="h-12 rounded-md border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-amber-300" required />
        <input name="password" type="password" placeholder="Password" className="h-12 rounded-md border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-amber-300" required />
        <button type="submit" className="h-12 rounded-md bg-white px-5 font-black text-slate-950">Entrar</button>
      </form>
      {message && <p className="mt-4 rounded-md bg-white/10 p-3 text-sm text-slate-200">{message}</p>}
    </section>
  );
}

function StatusBadge({ status = 'pending_review' }: { status?: string }) {
  const label = status === 'approved' ? 'Aprobado' : status === 'rejected' ? 'Rechazado' : status === 'paused' ? 'Pausado' : 'Pendiente de revision';
  const color = status === 'approved' ? 'bg-emerald-300' : status === 'rejected' ? 'bg-rose-300' : 'bg-amber-300';
  return <span className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-black text-slate-950 ${color}`}>{label}</span>;
}

function SocialLinks({ links }: { links: string[] }) {
  const cleanLinks = links.filter(Boolean);
  if (cleanLinks.length === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {cleanLinks.map((link, index) => (
        <a key={`${link}-${index}`} href={link} target="_blank" rel="noreferrer" className="rounded-md bg-white px-3 py-2 text-xs font-black text-slate-950">
          Link {index + 1}
        </a>
      ))}
    </div>
  );
}

function ruleLabel(rule: RewardRule) {
  const labels: Record<RewardRule, string> = {
    winner: 'Ganador',
    exact: 'Marcador exacto',
    goal_diff: 'Diferencia de goles',
    home_goals: 'Goles local',
    away_goals: 'Goles visitante',
    first_half_goals: 'Goles 1T',
    participate: 'Participar',
  };
  return labels[rule];
}

function MerchantStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/10 p-3 text-center">
      <strong className="block text-2xl font-black text-amber-300">{value}</strong>
      <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{label}</span>
    </div>
  );
}

function Field({ name, label, placeholder, type = 'text' }: { name: string; label: string; placeholder: string; type?: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-300">
      {label}
      <input name={name} type={type} min={type === 'number' ? 1 : undefined} placeholder={placeholder} className="h-12 rounded-md border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-amber-300" required />
    </label>
  );
}

function OptionalField({ name, label, placeholder }: { name: string; label: string; placeholder: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-300">
      {label}
      <input name={name} placeholder={placeholder} className="h-12 rounded-md border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-amber-300" />
    </label>
  );
}

function FileField({ label }: { label: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-300">
      {label}
      <input
        name="image"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="rounded-md border border-dashed border-white/20 bg-slate-950 px-3 py-3 text-sm text-slate-300 file:mr-4 file:rounded-md file:border-0 file:bg-amber-300 file:px-4 file:py-2 file:text-sm file:font-black file:text-slate-950 focus:border-amber-300 focus:outline-none"
        required
      />
    </label>
  );
}
