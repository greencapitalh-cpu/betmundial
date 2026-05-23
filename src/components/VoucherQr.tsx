'use client';

import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

export default function VoucherQr({ value, label }: { value: string; label?: string }) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    QRCode.toDataURL(value, {
      margin: 1,
      width: 148,
      color: {
        dark: '#050914',
        light: '#ffffff',
      },
    }).then(setSrc).catch(() => setSrc(''));
  }, [value]);

  return (
    <div className="inline-flex flex-col items-center rounded-lg bg-white p-2 text-slate-950">
      {src ? <img src={src} alt={label ?? `QR ${value}`} className="h-32 w-32" /> : <div className="h-32 w-32 bg-slate-100" />}
      <code className="mt-1 max-w-32 truncate text-xs font-black">{value}</code>
    </div>
  );
}
