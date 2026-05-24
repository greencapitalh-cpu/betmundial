'use client';

import { useEffect, useState } from 'react';
import { demoMerchants } from '@/lib/voucherDemo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://bet2back-production.up.railway.app';

type MerchantPromo = {
  name: string;
  city: string;
  zone: string;
  address: string;
  link: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  whatsapp: string;
  image: string;
  offer: string;
  rule: string;
};

type Match = {
  id: number;
  group_name: string;
  phase: string;
  match_date: string;
  city: string;
  venue: string;
  home_team: string;
  away_team: string;
  home_code: string;
  away_code: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
};

type OutreachLead = {
  id: number;
  city: string;
  source_app: string;
  business_name: string;
  category: string;
  contact_channel: string;
  contact_value: string;
  invite_url: string;
  status: string;
};

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<MerchantPromo[]>(demoMerchants);
  const [matches, setMatches] = useState<Match[]>([]);
  const [leads, setLeads] = useState<OutreachLead[]>([]);
  const [leadCityFilter, setLeadCityFilter] = useState('');
  const [resultMessage, setResultMessage] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/merchant-promotions`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((rows) => setPromos(rows.map((row: Record<string, unknown>) => ({
        name: String(row.merchant_name || ''),
        city: String(row.campaign_city || row.city || row.merchant_city || ''),
        zone: String(row.zone || ''),
        address: String(row.campaign_address || row.address || ''),
        link: String(row.link || ''),
        instagram: String(row.campaign_instagram_url || row.instagram_url || ''),
        facebook: String(row.campaign_facebook_url || row.facebook_url || ''),
        tiktok: String(row.campaign_tiktok_url || row.tiktok_url || ''),
        whatsapp: String(row.campaign_whatsapp_url || row.whatsapp_url || ''),
        image: String(row.image_url || '/world-cup-abstract-bg.png'),
        offer: String(row.description || ''),
        rule: 'Por visitar',
      }))))
      .catch(() => undefined);

    fetch(`${API_URL}/api/matches`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((rows) => setMatches(rows))
      .catch(() => undefined);

    fetch(`${API_URL}/api/outreach/leads`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(setLeads)
      .catch(() => undefined);
  }, []);

  async function uploadImage(formData: FormData) {
    const file = formData.get('image');
    if (!(file instanceof File) || file.size === 0) return '/world-cup-abstract-bg.png';

    const uploadData = new FormData();
    uploadData.append('image', file);
    uploadData.append('folder', 'admin-promotions');
    const response = await fetch(`${API_URL}/api/uploads/images`, {
      method: 'POST',
      body: uploadData,
    });
    if (!response.ok) throw new Error('Image upload failed');
    const payload = await response.json();
    return String(payload.url || '/world-cup-abstract-bg.png');
  }

  async function addPromo(formData: FormData) {
    const image = await uploadImage(formData).catch(() => '/world-cup-abstract-bg.png');
    const merchantPayload = {
      name: String(formData.get('name') || 'Local aliado'),
      city: String(formData.get('city') || ''),
      zone: String(formData.get('zone') || 'Zona mundialista'),
      address: String(formData.get('address') || ''),
      link: String(formData.get('link') || ''),
      instagram_url: String(formData.get('instagram') || ''),
      facebook_url: String(formData.get('facebook') || ''),
      tiktok_url: String(formData.get('tiktok') || ''),
      whatsapp_url: String(formData.get('whatsapp') || ''),
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
          city: merchantPayload.city,
          address: merchantPayload.address,
          link: merchantPayload.link,
          instagram_url: merchantPayload.instagram_url,
          facebook_url: merchantPayload.facebook_url,
          tiktok_url: merchantPayload.tiktok_url,
          whatsapp_url: merchantPayload.whatsapp_url,
          expires_at: String(formData.get('expires') || 'Durante el mundial'),
        }),
      });
    } catch {
      // Keep optimistic local state if the API is temporarily unavailable.
    }
    setPromos((current) => [{
      name: merchantPayload.name,
      city: merchantPayload.city,
      zone: merchantPayload.zone,
      address: merchantPayload.address,
      link: merchantPayload.link,
      instagram: merchantPayload.instagram_url,
      facebook: merchantPayload.facebook_url,
      tiktok: merchantPayload.tiktok_url,
      whatsapp: merchantPayload.whatsapp_url,
      image,
      offer: String(formData.get('offer') || 'Promo especial'),
      rule: String(formData.get('rule') || 'Participar'),
    }, ...current]);
  }

  async function publishResult(formData: FormData) {
    const matchId = Number(formData.get('match_id'));
    const homeScore = Number(formData.get('home_score'));
    const awayScore = Number(formData.get('away_score'));
    const firstHalfHome = formData.get('first_half_home_score');
    const firstHalfAway = formData.get('first_half_away_score');

    setResultMessage('Saving result and checking vouchers...');
    const response = await fetch(`${API_URL}/api/matches/${matchId}/result`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        home_score: homeScore,
        away_score: awayScore,
        first_half_home_score: firstHalfHome === '' ? null : Number(firstHalfHome),
        first_half_away_score: firstHalfAway === '' ? null : Number(firstHalfAway),
      }),
    });

    if (!response.ok) {
      setResultMessage('Could not save result. Please try again.');
      return;
    }

    setMatches((current) => current.map((match) => (
      match.id === matchId
        ? { ...match, home_score: homeScore, away_score: awayScore, status: 'final' }
        : match
    )));
    setResultMessage('Result saved. Matching vouchers were issued automatically.');
  }

  async function addLead(formData: FormData) {
    const payload = {
      city: String(formData.get('city') || ''),
      source_app: String(formData.get('source_app') || ''),
      business_name: String(formData.get('business_name') || ''),
      category: String(formData.get('category') || ''),
      contact_channel: String(formData.get('contact_channel') || 'manual'),
      contact_value: String(formData.get('contact_value') || ''),
      notes: String(formData.get('notes') || ''),
      frontend_url: 'https://betmundial.vercel.app',
    };
    const response = await fetch(`${API_URL}/api/outreach/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return;
    const lead = await response.json();
    setLeads((current) => [lead, ...current]);
  }

  async function bulkImportLeads(formData: FormData) {
    const city = String(formData.get('bulk_city') || '');
    const sourceApp = String(formData.get('bulk_source_app') || 'Google Maps');
    const rows = String(formData.get('bulk_rows') || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [businessName, category = '', contactValue = '', zone = ''] = line.split(',').map((part) => part.trim());
        return {
          city,
          source_app: sourceApp,
          business_name: businessName,
          category,
          contact_channel: contactValue.includes('@') ? 'email' : contactValue.includes('instagram') ? 'instagram' : contactValue ? 'whatsapp' : 'manual',
          contact_value: contactValue,
          notes: zone,
        };
      })
      .filter((lead) => lead.business_name);

    const response = await fetch(`${API_URL}/api/outreach/leads/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, source_app: sourceApp, frontend_url: 'https://betmundial.vercel.app', leads: rows }),
    });
    if (!response.ok) return;
    const created = await response.json();
    setLeads((current) => [...created, ...current]);
  }

  async function markLeadSent(lead: OutreachLead) {
    await fetch(`${API_URL}/api/outreach/leads/${lead.id}/sent`, { method: 'POST' }).catch(() => undefined);
    setLeads((current) => current.map((item) => item.id === lead.id ? { ...item, status: 'invited' } : item));
  }

  const visibleLeads = leads.filter((lead) => {
    const needle = leadCityFilter.trim().toLowerCase();
    if (!needle) return true;
    return [lead.city, lead.source_app, lead.business_name, lead.category].some((value) => String(value || '').toLowerCase().includes(needle));
  });

  return (
    <div className="stadium-surface min-h-screen px-4 py-10 text-white">
      <div className="mx-auto grid max-w-7xl gap-6">
        <section className="glass-panel rounded-lg p-5 md:p-7">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">Admin control room</p>
              <h1 className="mt-2 max-w-3xl text-4xl font-black leading-tight md:text-5xl">Publica locales, banners y campanas sin mezclar flujos.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Este panel queda separado del fan y del local: administra comercios, imagenes, ciudades, zonas, links y promociones visibles en la app.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:w-[360px]">
              <AdminStat value={String(promos.length)} label="locales" />
              <AdminStat value="Ads" label="cinta" />
              <AdminStat value="Links" label="redes" />
            </div>
          </div>
        </section>

        <section id="outreach" className="glass-panel rounded-lg p-5">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">Invitation engine</p>
              <h2 className="mt-1 text-3xl font-black">Prospect businesses by city</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Add restaurants, bars, clubs, cafes or stores from delivery apps, social networks, Google Maps, or manual research. Each lead gets a unique registration link.
              </p>
              <form action={addLead} className="mt-6 grid gap-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field name="city" label="City / market" placeholder="La Paz, Lima, Bogotá, Buenos Aires..." />
                  <Field name="source_app" label="Source app" placeholder="PedidosYa, Rappi, Uber Eats, Maps..." />
                  <Field name="business_name" label="Business name" placeholder="Local name" />
                  <Field name="category" label="Category" placeholder="Bar, burger, nightclub, cafe..." />
                </div>
                <div className="grid gap-3 sm:grid-cols-[0.55fr_1.45fr]">
                  <label className="grid gap-2 text-sm font-semibold text-slate-300">
                    Channel
                    <select name="contact_channel" className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-amber-300">
                      <option value="whatsapp">WhatsApp</option>
                      <option value="email">Email</option>
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                      <option value="tiktok">TikTok</option>
                      <option value="manual">Manual</option>
                    </select>
                  </label>
                  <Field name="contact_value" label="Contact" placeholder="phone, email, profile URL or handle" />
                </div>
                <OptionalField name="notes" label="Notes" placeholder="Promo angle, best contact time, neighborhood..." />
                <button className="fantasy-button h-12 rounded-md font-black transition">Create invitation link</button>
              </form>
              <form action={bulkImportLeads} className="mt-6 grid gap-4 rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-300">Bulk import</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field name="bulk_city" label="City / market" placeholder="La Paz, Lima, Bogotá..." />
                  <Field name="bulk_source_app" label="Source" placeholder="Google Maps, PedidosYa, Rappi..." />
                </div>
                <label className="grid gap-2 text-sm font-semibold text-slate-300">
                  One local per line
                  <textarea
                    name="bulk_rows"
                    placeholder="Local name, category, phone/email/profile, zone"
                    className="min-h-32 rounded-md border border-white/10 bg-slate-950 px-3 py-3 text-white outline-none focus:border-amber-300"
                    required
                  />
                </label>
                <button className="h-12 rounded-md bg-white font-black text-slate-950 transition" type="submit">Import leads</button>
              </form>
            </div>
            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-300">Pipeline</p>
                  <h3 className="mt-1 text-2xl font-black">Invitation list</h3>
                </div>
                <input
                  value={leadCityFilter}
                  onChange={(event) => setLeadCityFilter(event.target.value)}
                  placeholder="Filter city, app or local"
                  className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-amber-300"
                />
              </div>
              <div className="mt-5 grid gap-3">
                {visibleLeads.map((lead) => (
                  <article key={lead.id} className="fixture-card rounded-lg border border-white/10 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">{lead.city} · {lead.source_app}</p>
                        <h4 className="mt-1 text-xl font-black">{lead.business_name}</h4>
                        <p className="mt-1 text-sm text-slate-300">{lead.category} · {lead.contact_channel}: {lead.contact_value}</p>
                        <p className="mt-2 break-all text-xs text-slate-400">{lead.invite_url}</p>
                      </div>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase text-slate-200">{lead.status}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a href={messageLink(lead)} target="_blank" rel="noreferrer" onClick={() => markLeadSent(lead)} className="rounded-md bg-white px-3 py-2 text-xs font-black text-slate-950">
                        Send invite
                      </a>
                      <button type="button" onClick={() => navigator.clipboard?.writeText(inviteText(lead))} className="rounded-md bg-white/10 px-3 py-2 text-xs font-black text-slate-100">
                        Copy text
                      </button>
                    </div>
                  </article>
                ))}
                {visibleLeads.length === 0 && <div className="rounded-lg border border-dashed border-white/15 p-6 text-sm text-slate-300">No leads yet.</div>}
              </div>
            </div>
          </div>
        </section>

        <section id="results" className="glass-panel rounded-lg p-5">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">Match results</p>
              <h2 className="mt-1 text-3xl font-black">Load final score and award vouchers</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                When a result is saved, the backend compares every prediction against active merchant rules and creates the valid voucher codes.
              </p>
              <form action={publishResult} className="mt-6 grid gap-4">
                <label className="grid gap-2 text-sm font-semibold text-slate-300">
                  Match
                  <select name="match_id" className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-amber-300">
                    {matches.slice(0, 104).map((match) => (
                      <option key={match.id} value={match.id}>
                        M{match.id} · {match.group_name || match.phase} · {match.home_code} {match.home_team} vs {match.away_code} {match.away_team}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field name="home_score" label="Home final score" placeholder="2" type="number" />
                  <Field name="away_score" label="Away final score" placeholder="1" type="number" />
                  <OptionalField name="first_half_home_score" label="Home 1st half" placeholder="1" />
                  <OptionalField name="first_half_away_score" label="Away 1st half" placeholder="0" />
                </div>
                <button className="fantasy-button h-12 rounded-md font-black transition">Save result and issue vouchers</button>
                {resultMessage && <p className="rounded-md bg-white/10 p-3 text-sm text-slate-200">{resultMessage}</p>}
              </form>
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-300">Recently finalized</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {matches.filter((match) => match.status === 'final').slice(0, 6).map((match) => (
                  <article key={match.id} className="fixture-card rounded-lg border border-white/10 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">M{match.id} · {match.city}</p>
                    <div className="mt-3 grid grid-cols-[1fr_auto] gap-3 text-sm">
                      <strong>{match.home_code} {match.home_team}</strong>
                      <strong className="text-amber-300">{match.home_score}</strong>
                      <strong>{match.away_code} {match.away_team}</strong>
                      <strong className="text-amber-300">{match.away_score}</strong>
                    </div>
                  </article>
                ))}
                {matches.filter((match) => match.status === 'final').length === 0 && (
                  <div className="rounded-lg border border-dashed border-white/15 p-6 text-sm text-slate-300">
                    No finalized matches yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section id="publish" className="glass-panel rounded-lg p-5">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">Admin publisher</p>
          <h1 className="mt-1 text-3xl font-black">Publish local promotions</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            The local gives you the promotion, image, address, zone, and social/page link. You publish it as a coupon campaign.
          </p>

          <form action={addPromo} className="mt-6 grid gap-4">
            <Field name="name" label="Local name" placeholder="Boliche La Final" />
            <Field name="offer" label="Promotion" placeholder="2x1 in entry before midnight" />
            <Field name="city" label="Campaign city / market" placeholder="La Paz, Bogotá, Lima, Miami..." />
            <Field name="zone" label="Zone" placeholder="Azteca / Tlalpan" />
            <Field name="address" label="Text address" placeholder="Street, number, city" />
            <Field name="link" label="Social, page, or Maps link" placeholder="https://instagram.com/local" />
            <div className="grid gap-3 sm:grid-cols-2">
              <OptionalField name="instagram" label="Instagram" placeholder="https://instagram.com/local" />
              <OptionalField name="facebook" label="Facebook" placeholder="https://facebook.com/local" />
              <OptionalField name="tiktok" label="TikTok" placeholder="https://tiktok.com/@local" />
              <OptionalField name="whatsapp" label="WhatsApp" placeholder="https://wa.me/..." />
            </div>
            <FileField label="Promotion image" />
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
                  <p className="mt-2 text-sm font-bold text-emerald-200">{promo.city}</p>
                  <p className="mt-2 text-sm text-slate-300">{promo.zone}</p>
                  <p className="mt-1 text-sm text-slate-400">{promo.address}</p>
                  <SocialLinks links={[promo.link, promo.instagram, promo.facebook, promo.tiktok, promo.whatsapp]} />
                </div>
              </article>
            ))}
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}

function AdminStat({ value, label }: { value: string; label: string }) {
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
      <input name={name} type={type} min={type === 'number' ? 0 : undefined} placeholder={placeholder} className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-amber-300" required />
    </label>
  );
}

function OptionalField({ name, label, placeholder }: { name: string; label: string; placeholder: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-300">
      {label}
      <input name={name} type="number" min={0} placeholder={placeholder} className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-amber-300" />
    </label>
  );
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

function inviteText(lead: OutreachLead) {
  return `Hola ${lead.business_name}, estamos invitando locales de ${lead.city} a publicar promociones mundialistas para usuarios que aciertan resultados. Puedes crear tu promo aqui: ${lead.invite_url}`;
}

function messageLink(lead: OutreachLead) {
  const text = encodeURIComponent(inviteText(lead));
  if (lead.contact_channel === 'whatsapp') {
    const phone = lead.contact_value.replace(/[^\d]/g, '');
    return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
  }
  if (lead.contact_channel === 'email') {
    return `mailto:${lead.contact_value}?subject=${encodeURIComponent('Invitacion a publicar promociones mundialistas')}&body=${text}`;
  }
  return lead.contact_value || lead.invite_url;
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
