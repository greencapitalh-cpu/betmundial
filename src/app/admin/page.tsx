'use client';

import { useEffect, useState } from 'react';
import { demoMerchants } from '@/lib/voucherDemo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://bet2back-production.up.railway.app';

type MerchantPromo = {
  name: string;
  zone: string;
  address: string;
  link: string;
  image: string;
  offer: string;
  rule: string;
};

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<MerchantPromo[]>(demoMerchants);

  useEffect(() => {
    fetch(`${API_URL}/api/merchant-promotions`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((rows) => setPromos(rows.map((row: Record<string, unknown>) => ({
        name: String(row.merchant_name || ''),
        zone: String(row.zone || ''),
        address: '',
        link: String(row.link || ''),
        image: String(row.image_url || '/world-cup-abstract-bg.png'),
        offer: String(row.description || ''),
        rule: 'Por visitar',
      }))))
      .catch(() => undefined);
  }, []);

  async function addPromo(formData: FormData) {
    const image = String(formData.get('image_url') || '/world-cup-abstract-bg.png');
    const merchantPayload = {
      name: String(formData.get('name') || 'Local aliado'),
      zone: String(formData.get('zone') || 'Zona mundialista'),
      address: String(formData.get('address') || ''),
      link: String(formData.get('link') || ''),
      image_url: image,
    };
    let merchantId = 1;
    try {
      const merchantResponse = await fetch(`${API_URL}/api/merchants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merchantPayload),
      });
      const merchant = await merchantResponse.json();
      merchantId = Number(merchant.id || 1);
      await fetch(`${API_URL}/api/merchant-promotions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_id: merchantId,
          title: String(formData.get('offer') || 'Promo especial'),
          description: String(formData.get('offer') || 'Promo especial'),
          image_url: image,
          link: merchantPayload.link,
          expires_at: String(formData.get('expires') || 'Durante el mundial'),
        }),
      });
    } catch {
      // Keep optimistic local state if the API is temporarily unavailable.
    }
    setPromos((current) => [{ ...merchantPayload, image, offer: String(formData.get('offer') || 'Promo especial'), rule: String(formData.get('rule') || 'Participar') }, ...current]);
  }

  return (
    <div className="stadium-surface min-h-screen px-4 py-10 text-white">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section id="publish" className="glass-panel rounded-lg p-5">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">Admin publisher</p>
          <h1 className="mt-1 text-3xl font-black">Publish local promotions</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            The local gives you the promotion, image, address, zone, and social/page link. You publish it as a coupon campaign.
          </p>

          <form action={addPromo} className="mt-6 grid gap-4">
            <Field name="name" label="Local name" placeholder="Boliche La Final" />
            <Field name="offer" label="Promotion" placeholder="2x1 in entry before midnight" />
            <Field name="zone" label="Zone" placeholder="Azteca / Tlalpan" />
            <Field name="address" label="Text address" placeholder="Street, number, city" />
            <Field name="link" label="Social, page, or Maps link" placeholder="https://instagram.com/local" />
            <Field name="image_url" label="Image URL" placeholder="https://..." />
            <Field name="expires" label="Validity" placeholder="During match days" />
            <label className="grid gap-2 text-sm font-semibold text-slate-300">
              Prize rule
              <select name="rule" className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-amber-300">
                <option>Marcador exacto</option>
                <option>Acertar ganador</option>
                <option>Solo participar</option>
              </select>
            </label>
            <button className="fantasy-button h-12 rounded-md font-black transition">Publish promotion</button>
          </form>
        </section>

        <section id="board" className="glass-panel rounded-lg p-5">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-300">Live promotion board</p>
          <h2 className="mt-1 text-3xl font-black">Local ads and coupon campaigns</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {promos.map((promo, index) => (
              <article key={`${promo.name}-${index}`} className="promo-ticket rounded-lg">
                <img src={promo.image} alt={promo.name} className="h-40 w-full rounded-t-lg object-cover" />
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-xl font-black">{promo.name}</h3>
                    <span className="rounded-full bg-amber-300 px-2 py-1 text-xs font-black text-slate-950">{promo.rule}</span>
                  </div>
                  <p className="text-lg font-bold text-amber-200">{promo.offer}</p>
                  <p className="mt-2 text-sm text-slate-300">{promo.zone}</p>
                  <p className="mt-1 text-sm text-slate-400">{promo.address}</p>
                  {promo.link && <a href={promo.link} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-md bg-white px-4 py-2 text-sm font-black text-slate-950">Open link</a>}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ name, label, placeholder }: { name: string; label: string; placeholder: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-300">
      {label}
      <input name={name} placeholder={placeholder} className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-amber-300" required />
    </label>
  );
}
