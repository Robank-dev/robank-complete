'use client';

import { useAccount } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

export default function ReceiveCard() {
  const { authenticated } = usePrivy();
  const { address } = useAccount();
  const [qr, setQr] = useState('');

  useEffect(() => {
    if (!authenticated || !address) {
      setQr('');
      return;
    }
    QRCode.toDataURL(address, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#050607', light: '#f4f5f7' }
    }).then(setQr).catch(() => setQr(''));
  }, [authenticated, address]);

  return (
    <div className="rounded-2xl border border-ro-line bg-ro-panel p-5">
      <div className="text-sm text-white/50">Receive</div>
      <div className="mt-4 grid gap-6 md:grid-cols-[280px_1fr] md:items-center">
        <div className="mx-auto grid aspect-square w-full max-w-[280px] place-items-center rounded-xl bg-[#f4f5f7] p-3">
          {qr ? <img src={qr} alt="Wallet QR code" className="h-full w-full rounded-lg object-contain" /> : (
            <span className="px-5 text-center text-xs leading-5 text-black/50">
              {authenticated ? 'Wallet address is preparing…' : 'Sign in with email to view your wallet QR'}
            </span>
          )}
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[.16em] text-white/35">WALLET ADDRESS</div>
          <div className="mt-2 break-all rounded-xl border border-white/10 bg-black/20 p-4 font-mono text-xs text-white/70">
            {address || 'Wallet preparing…'}
          </div>
          <button type="button" onClick={() => address && navigator.clipboard?.writeText(address)} disabled={!address} className="mt-3 rounded-xl border border-white/10 px-4 py-2 text-xs text-white/75 disabled:opacity-40">
            Copy address
          </button>
        </div>
      </div>
    </div>
  );
}

