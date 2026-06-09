'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .then(async (registration) => {
          await registration.update();
          if (registration.waiting) registration.waiting.postMessage('SKIP_WAITING');
        })
        .catch(() => undefined);
    }
  }, []);

  return null;
}
