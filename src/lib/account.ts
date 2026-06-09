export type Account = {
  id: string;
  email: string;
  username?: string;
  token: string;
};

const STORAGE_KEY = 'udochain-escrow-session';

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
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
}

export function clearAccount() {
  window.localStorage.removeItem(STORAGE_KEY);
}
