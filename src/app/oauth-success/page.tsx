'use client';

import { useEffect } from 'react';
import { saveAccount } from '@/lib/account';

const API_URL = (process.env.NEXT_PUBLIC_UDOCHAIN_API_URL || 'https://api.udochain.com').replace(/\/$/, '');

export default function OAuthSuccessPage() {
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      window.location.replace('/?auth=failed');
      return;
    }

    fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('OAuth session failed');
        const user = await response.json();
        saveAccount({
          id: user._id,
          email: user.email,
          username: user.username,
          token,
        });
        window.location.replace('/?auth=success');
      })
      .catch(() => window.location.replace('/?auth=failed'));
  }, []);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-cyan-300/25 border-t-cyan-300" />
        <p className="mt-4 font-bold text-white">Completing secure sign in...</p>
      </div>
    </div>
  );
}
