'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import VoucherQr from '@/components/VoucherQr';
import { demoVouchers } from '@/lib/voucherDemo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://bet2back-production.up.railway.app';

type RewardRule = 'winner' | 'exact' | 'goal_diff' | 'home_goals' | 'away_goals' | 'first_half_goals' | 'participate';

type MerchantReward = {
  id: number;
  title: string;
  prize: string;
  rule: RewardRule;
  quantity: number;
  expires: string;
  image: string;
};

type VisitPromo = {
  id: number;
  title: string;
  description: string;
  image: string;
  link: string;
  expires: string;
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
    { id: 1, title: 'Exact score night', prize: '2x1 en entrada antes de medianoche', rule: 'exact', quantity: 80, expires: '12 Jun 23:59', image: '/world-cup-abstract-bg.png' },
    { id: 2, title: 'Winner pick promo', prize: 'Shot de bienvenida para mesa mundialista', rule: 'winner', quantity: 120, expires: '30 Jun 23:59', image: '/world-cup-abstract-bg.png' },
  ]);
  const [visitPromos, setVisitPromos] = useState<VisitPromo[]>([
    { id: 1, title: 'Happy hour mundialista', description: '10% off mostrando la app en barra.', image: '/world-cup-abstract-bg.png', link: 'https://maps.google.com', expires: 'Durante partidos' },
  ]);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const voucher = useMemo(() => {
    return demoVouchers.find((item) => item.code.toLowerCase() === code.trim().toLowerCase());
  }, [code]);

  const effectiveStatus = voucher && usedCodes.includes(voucher.code) ? 'used' : voucher?.status;
  const isValid = voucher && effectiveStatus === 'valid';
  const displayedStatus = apiVoucher?.status || effectiveStatus;
  const displayedIsValid = apiVoucher ? apiVoucher.status === 'valid' : isValid;

  useEffect(() => {
    fetch(`${API_URL}/api/merchant-rewards`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((rows) => setRewards(rows.map((row: Record<string, unknown>) => ({
        id: Number(row.id),
        title: String(row.title || ''),
        prize: String(row.prize || ''),
        rule: String(row.rule || 'participate') as RewardRule,
        quantity: Number(row.quantity || 0),
        expires: String(row.expires_at || ''),
        image: String(row.image_url || '/world-cup-abstract-bg.png'),
      }))))
      .catch(() => undefined);

    fetch(`${API_URL}/api/merchant-promotions`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((rows) => setVisitPromos(rows.map((row: Record<string, unknown>) => ({
        id: Number(row.id),
        title: String(row.title || ''),
        description: String(row.description || ''),
        image: String(row.image_url || '/world-cup-abstract-bg.png'),
        link: String(row.link || '#'),
        expires: String(row.expires_at || ''),
      }))))
      .catch(() => undefined);
  }, []);

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

  function addReward(formData: FormData) {
    const image = String(formData.get('image_url') || '/world-cup-abstract-bg.png');
    fetch(`${API_URL}/api/merchant-rewards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: 1,
        title: String(formData.get('title') || 'Nueva promo'),
        prize: String(formData.get('prize') || 'Premio especial'),
        rule: String(formData.get('rule')),
        quantity: Number(formData.get('quantity') || 50),
        expires_at: String(formData.get('expires') || 'Durante el mundial'),
        image_url: image,
      }),
    }).catch(() => undefined);
    setRewards((current) => [{
      id: Date.now(),
      title: String(formData.get('title') || 'Nueva promo'),
      prize: String(formData.get('prize') || 'Premio especial'),
      rule: String(formData.get('rule')) as RewardRule,
      quantity: Number(formData.get('quantity') || 50),
      expires: String(formData.get('expires') || 'Durante el mundial'),
      image,
    }, ...current]);
  }

  function addVisitPromo(formData: FormData) {
    const image = String(formData.get('image_url') || '/world-cup-abstract-bg.png');
    fetch(`${API_URL}/api/merchant-promotions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: 1,
        title: String(formData.get('title') || 'Promo por visita'),
        description: String(formData.get('description') || 'Beneficio mostrando la app'),
        image_url: image,
        link: String(formData.get('link') || 'https://maps.google.com'),
        expires_at: String(formData.get('expires') || 'Durante el mundial'),
      }),
    }).catch(() => undefined);
    setVisitPromos((current) => [{
      id: Date.now(),
      title: String(formData.get('title') || 'Promo por visita'),
      description: String(formData.get('description') || 'Beneficio mostrando la app'),
      image,
      link: String(formData.get('link') || 'https://maps.google.com'),
      expires: String(formData.get('expires') || 'Durante el mundial'),
    }, ...current]);
  }

  return (
    <div className="stadium-surface min-h-screen px-4 py-10 text-white">
      <div className="mx-auto grid max-w-7xl gap-6">
        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="glass-panel rounded-lg p-5">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">Local rewards</p>
            <h1 className="mt-1 text-3xl font-black">Premios que entrega el local</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Cada local define que premio entrega y por que tipo de acierto: ganador, marcador exacto, diferencia de goles, goles de un equipo o goles del primer tiempo.
            </p>

            <form action={addReward} className="mt-6 grid gap-4">
              <Field name="title" label="Nombre de la campaña" placeholder="Noche de marcador exacto" />
              <Field name="prize" label="Premio / vale" placeholder="2x1 en entrada, bebida gratis, descuento..." />
              <Field name="image_url" label="URL de foto del premio" placeholder="https://..." />
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
              <button className="fantasy-button h-12 rounded-md font-black transition">Guardar premio</button>
            </form>
          </div>

          <div className="glass-panel rounded-lg p-5">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-300">Active campaigns</p>
            <h2 className="mt-1 text-3xl font-black">Premios publicados</h2>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {rewards.map((reward) => (
                <article key={reward.id} className="promo-ticket rounded-lg p-4">
                  <img src={reward.image} alt={reward.title} className="mb-4 h-36 w-full rounded-md object-cover" />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="rounded-full bg-amber-300 px-2 py-1 text-xs font-black text-slate-950">{ruleLabel(reward.rule)}</span>
                      <h3 className="mt-4 text-xl font-black">{reward.title}</h3>
                      <p className="mt-2 text-slate-300">{reward.prize}</p>
                    </div>
                    <div className="rounded-md bg-white/10 px-3 py-2 text-right">
                      <strong className="text-2xl text-amber-300">{reward.quantity}</strong>
                      <p className="text-xs text-slate-400">vales</p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-400">Vigencia: {reward.expires}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="glass-panel rounded-lg p-5">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">Visit promos</p>
            <h2 className="mt-1 text-3xl font-black">Promos abiertas por visitar</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Estas promociones no dependen de acertar. Sirven como publicidad del local para atraer gente desde la app.
            </p>
            <form action={addVisitPromo} className="mt-6 grid gap-4">
              <Field name="title" label="Titulo de la promo" placeholder="Happy hour mundialista" />
              <Field name="description" label="En que consiste" placeholder="10% off mostrando la app" />
              <Field name="image_url" label="URL de foto / banner" placeholder="https://..." />
              <Field name="link" label="Link del local" placeholder="Instagram, web o Google Maps" />
              <Field name="expires" label="Vigencia" placeholder="Durante partidos" />
              <button className="fantasy-button h-12 rounded-md font-black transition">Publicar promo por visita</button>
            </form>
          </div>

          <div className="glass-panel rounded-lg p-5">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-300">Public ads</p>
            <h2 className="mt-1 text-3xl font-black">Promos visibles para todos</h2>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {visitPromos.map((promo) => (
                <article key={promo.id} className="promo-ticket rounded-lg">
                  <img src={promo.image} alt={promo.title} className="h-40 w-full rounded-t-lg object-cover" />
                  <div className="p-4">
                    <span className="rounded-full bg-emerald-300 px-2 py-1 text-xs font-black text-slate-950">Por visitar</span>
                    <h3 className="mt-4 text-xl font-black">{promo.title}</h3>
                    <p className="mt-2 text-slate-300">{promo.description}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">Vigencia: {promo.expires}</p>
                    <a href={promo.link} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-md bg-white px-4 py-2 text-sm font-black text-slate-950">Abrir link</a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
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
      </div>
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

function Field({ name, label, placeholder, type = 'text' }: { name: string; label: string; placeholder: string; type?: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-300">
      {label}
      <input name={name} type={type} min={type === 'number' ? 1 : undefined} placeholder={placeholder} className="h-12 rounded-md border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-amber-300" required />
    </label>
  );
}
