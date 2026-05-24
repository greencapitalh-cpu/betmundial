export type AccountRole = 'fan' | 'merchant' | 'admin';

export type Account = {
  id: number;
  role: AccountRole;
  name: string;
  email: string;
  city?: string;
  merchant_id?: number | null;
  token?: string;
};

const STORAGE_KEY = 'golazo-account';

export function readAccount(): Account | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as Account : null;
  } catch {
    return null;
  }
}

export function saveAccount(account: Account) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
}

export function clearAccount() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
