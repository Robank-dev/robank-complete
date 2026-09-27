'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ROBINHOOD, USDG, NATIVE_LOGOS, STABLE_META, explorerAddress } from '@/lib/chains';
import { useEnsureEvmWallet, useRobankAccount } from '@/lib/hooks/useRobankAccount';
import CopyButton from './CopyButton';
import { Alert, Skeleton } from './ui';

export default function ReceiveCard() {
  const { evmAddress: address, walletsReady } = useRobankAccount();
  const { ensure, error, pending } = useEnsureEvmWallet();
  const [qr, setQr] = useState('');
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (address || !walletsReady) { setSlow(false); return; }
    const t = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(t);
  }, [address, walletsReady]);

  useEffect(() => {
    if (!address) { setQr(''); return; }
    QRCode.toDataURL(address, { width: 440, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#060708', light: '#f6f7f8' } }).then(setQr).catch(() => setQr(''));
  }, [address]);

  return (
    <div className="ui-grid" style={{ gap: 14 }}>
      <section className="ui-panel receive-panel">
        <div className="receive-qr">{qr ? <img src={qr} alt={`QR code for your ${ROBINHOOD.label} address`} /> : <Skeleton h={220} w={220} />}</div>
        <div className="receive-info">
          <span className="ui-kicker" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><img src={ROBINHOOD.icon} alt="" width={16} height={16} />Your {ROBINHOOD.label} address</span>
          <p className="receive-address ui-mono">{address || 'Your wallet is being prepared…'}</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <CopyButton value={address} label="Copy address" disabled={!address} />
            {address && <a className="ui-btn ghost" href={explorerAddress(ROBINHOOD.id, address)} target="_blank" rel="noreferrer">View on explorer ↗</a>}
          </div>
          {!address && (slow || error) && (
            <div style={{ display: 'grid', gap: 8 }}>
              {error && <Alert tone="warn">{error}</Alert>}
              <button className="ui-btn" onClick={() => ensure()} disabled={pending}>{pending ? 'Creating wallet…' : 'Create my wallet'}</button>
            </div>
          )}
          <Alert tone="warn">Send only tokens on <b>{ROBINHOOD.label}</b> to this address. Tokens sent on Ethereum, Base, Solana or any other network will not arrive in ROBANK and may be lost.</Alert>
        </div>
      </section>

      <section className="ui-panel">
        <span className="ui-kicker">What you can deposit</span>
        <div className="ui-list" style={{ marginTop: 10 }}>
          <div className="ui-row"><span className="ui-token"><img src={STABLE_META.USDG.logo} alt="" /></span><div className="ui-row-main"><b>{USDG.symbol}</b><span>{STABLE_META.USDG.name} · valued at $1.00</span></div></div>
          <div className="ui-row"><span className="ui-token"><img src={NATIVE_LOGOS.ETH} alt="" /></span><div className="ui-row-main"><b>ETH</b><span>Pays network fees on {ROBINHOOD.label} — keep a little in your wallet</span></div></div>
          <div className="ui-row"><span className="ui-token"><img src={ROBINHOOD.icon} alt="" /></span><div className="ui-row-main"><b>Robinhood Stock Tokens</b><span>Shown at indicative reference prices</span></div></div>
        </div>
        <p className="ui-muted" style={{ fontSize: 12, marginTop: 12 }}>Any other token on {ROBINHOOD.label} also arrives in your wallet and is visible on the explorer. When withdrawing from an exchange, choose {ROBINHOOD.label} as the network. Stock tokens can only be held by eligible users under the issuer&apos;s terms.</p>
      </section>
    </div>
  );
}
