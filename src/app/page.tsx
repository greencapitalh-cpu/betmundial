'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useLocale, type Locale } from '@/components/LocaleProvider';
import { saveAccount, type Account } from '@/lib/account';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://bet2back-production.up.railway.app';

const copy: Record<Locale, {
  kicker: string;
  title: string;
  body: string;
  access: string;
  fan: string;
  fanText: string;
  merchant: string;
  merchantText: string;
  admin: string;
  adminText: string;
}> = {
  en: {
    kicker: 'GolazoPromo access',
    title: 'Choose your World Cup flow.',
    body: 'Fan predictions, merchant rewards, and admin publishing are separated so each user enters only the workspace they need.',
    access: 'Enter',
    fan: 'Fan app',
    fanText: 'Predict fixtures, save your picks, and claim vouchers when you win.',
    merchant: 'Business console',
    merchantText: 'Create rewards, publish visit promos, and validate voucher QR codes.',
    admin: 'Admin console',
    adminText: 'Publish and review local promotions before they appear in the fan app.',
  },
  es: {
    kicker: 'Acceso GolazoPromo',
    title: 'Elige tu flujo mundialista.',
    body: 'Pronosticos de usuarios, premios de locales y publicacion admin quedan separados para que cada persona entre solo a su espacio.',
    access: 'Entrar',
    fan: 'App apostador',
    fanText: 'Ve el fixture, guarda predicciones y reclama vales cuando aciertas.',
    merchant: 'Panel empresa',
    merchantText: 'Crea premios, publica promos por visita y valida codigos QR.',
    admin: 'Panel admin',
    adminText: 'Publica y revisa promociones de locales antes de mostrarlas al usuario.',
  },
  pt: {
    kicker: 'Acesso GolazoPromo',
    title: 'Escolha seu fluxo mundial.',
    body: 'Apostas dos usuarios, premios de locais e publicacao admin ficam separados para cada pessoa entrar no espaco certo.',
    access: 'Entrar',
    fan: 'App apostador',
    fanText: 'Veja a tabela, salve palpites e resgate cupons quando acertar.',
    merchant: 'Painel empresa',
    merchantText: 'Crie premios, publique promos por visita e valide QR codes.',
    admin: 'Painel admin',
    adminText: 'Publique e revise promocoes de locais antes de aparecerem no app.',
  },
  fr: {
    kicker: 'Acces GolazoPromo',
    title: 'Choisissez votre flux mondial.',
    body: 'Pronostics fan, recompenses commerce et publication admin sont separes pour que chaque role entre dans son propre espace.',
    access: 'Entrer',
    fan: 'App pronostiqueur',
    fanText: 'Consultez le calendrier, sauvegardez vos pronostics et reclamez vos coupons.',
    merchant: 'Console commerce',
    merchantText: 'Creez des prix, publiez des promos et validez les QR codes.',
    admin: 'Console admin',
    adminText: 'Publiez et verifiez les promotions avant leur affichage dans l app.',
  },
};

const cards = [
  { key: 'fan', href: '/fan', tone: 'from-amber-300 via-rose-400 to-emerald-300' },
  { key: 'merchant', href: '/merchant', tone: 'from-emerald-300 via-cyan-300 to-amber-300' },
  { key: 'admin', href: '/admin', tone: 'from-sky-300 via-violet-300 to-amber-300' },
] as const;

export default function PortalPage() {
  const { locale } = useLocale();
  const t = copy[locale];
  const [registerRole, setRegisterRole] = useState<'fan' | 'merchant' | 'admin'>('fan');
  const [registerMessage, setRegisterMessage] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [loggedAccount, setLoggedAccount] = useState<Account | null>(null);

  async function registerAccount(formData: FormData) {
    const payload = {
      role: registerRole,
      name: String(formData.get('name') || ''),
      email: String(formData.get('email') || ''),
      password: String(formData.get('password') || ''),
      city: String(formData.get('city') || ''),
      merchant_name: String(formData.get('merchant_name') || ''),
    };
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      setRegisterMessage(error.next === 'login' ? 'Esa cuenta ya existe. Ahora entra desde Login.' : 'No se pudo crear la cuenta. Revisa los datos.');
      return;
    }
    const account = await response.json();
    setRegisterMessage(`Cuenta ${account.role} creada. Ahora inicia sesion para entrar a ${account.access_path}.`);
    setLoginMessage('Cuenta creada. Usa el mismo email y password para iniciar sesion.');
  }

  async function loginAccount(formData: FormData) {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: String(formData.get('email') || ''),
        password: String(formData.get('password') || ''),
      }),
    });
    if (!response.ok) {
      setLoginMessage('No se pudo iniciar sesion. Primero crea la cuenta o revisa email/password.');
      return;
    }
    const account = await response.json() as Account;
    saveAccount(account);
    setLoggedAccount(account);
    setLoginMessage(`Sesion iniciada como ${account.role}.`);
  }

  return (
    <div className="stadium-surface min-h-screen text-white">
      <section className="world-hero-bg border-b border-white/10">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:min-h-[calc(100vh-73px)] lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:py-20">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-amber-300">{t.kicker}</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight md:text-6xl">{t.title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">{t.body}</p>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              <Stat value="104" label="matches" />
              <Stat value="3" label="frontends" />
              <Stat value="QR" label="vouchers" />
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-4 xl:grid-cols-2">
              <section className="glass-panel rounded-lg p-5">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">1. Crear cuenta</p>
                <h2 className="mt-1 text-2xl font-black">Registro por tipo de usuario</h2>
                <p className="mt-2 text-sm text-slate-300">Esto crea la cuenta en la DB con rol, ciudad y acceso asignado.</p>
                <form action={registerAccount} className="mt-4 grid gap-3">
                  <div className="grid grid-cols-3 gap-2">
                    {(['fan', 'merchant', 'admin'] as const).map((role) => (
                      <button key={role} type="button" onClick={() => setRegisterRole(role)} className={`h-10 rounded-md text-sm font-black ${registerRole === role ? 'bg-white text-slate-950' : 'bg-white/10 text-slate-200'}`}>
                        {role}
                      </button>
                    ))}
                  </div>
                  <AuthField name="name" placeholder="Nombre responsable" />
                  {registerRole === 'merchant' && <AuthField name="merchant_name" placeholder="Nombre del local" />}
                  <AuthField name="city" placeholder="Ciudad o mercado" />
                  <AuthField name="email" placeholder="Email" type="email" />
                  <AuthField name="password" placeholder="Password minimo 6 caracteres" type="password" />
                  <button className="fantasy-button h-11 rounded-md font-black" type="submit">Crear cuenta</button>
                  {registerMessage && <p className="rounded-md bg-white/10 p-3 text-sm text-slate-200">{registerMessage}</p>}
                </form>
              </section>

              <section className="glass-panel rounded-lg p-5">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-300">2. Login</p>
                <h2 className="mt-1 text-2xl font-black">Entrar con cuenta existente</h2>
                <p className="mt-2 text-sm text-slate-300">Login no crea usuarios: valida email/password y abre el panel segun el rol guardado.</p>
                <form action={loginAccount} className="mt-4 grid gap-3">
                  <AuthField name="email" placeholder="Email" type="email" />
                  <AuthField name="password" placeholder="Password" type="password" />
                  <button className="h-11 rounded-md bg-white font-black text-slate-950" type="submit">Iniciar sesion</button>
                  {loginMessage && <p className="rounded-md bg-white/10 p-3 text-sm text-slate-200">{loginMessage}</p>}
                  {loggedAccount?.access_path && (
                    <Link href={loggedAccount.access_path} className="rounded-md bg-amber-300 px-4 py-3 text-center text-sm font-black text-slate-950">
                      Ir a {loggedAccount.label || loggedAccount.role}
                    </Link>
                  )}
                </form>
              </section>
            </div>

            {cards.map((card) => (
              <Link key={card.key} href={card.href} className="promo-ticket role-card group block rounded-lg p-1 transition hover:border-amber-300/70">
                <div className={`h-2 rounded-t-md bg-gradient-to-r ${card.tone}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black">{t[card.key]}</h2>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">{t[`${card.key}Text`]}</p>
                    </div>
                    <span className="rounded-md bg-white px-4 py-2 text-sm font-black text-slate-950 transition group-hover:bg-amber-300">{t.access}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function AuthField({ name, placeholder, type = 'text' }: { name: string; placeholder: string; type?: string }) {
  return (
    <input
      name={name}
      type={type}
      placeholder={placeholder}
      className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-amber-300"
      required
    />
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/10 p-3">
      <strong className="block text-2xl font-black text-amber-300">{value}</strong>
      <span className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</span>
    </div>
  );
}
