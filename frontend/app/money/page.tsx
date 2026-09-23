'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import AppShell from '@/components/AppShell';
import SendForm from '@/components/SendForm';
import OnrampWidget from '@/components/OnrampWidget';
import { useAccount } from 'wagmi';

type Mode = 'send' | 'fund-bank' | 'fund-wallet';

function FundWalletPanel() {
  const { address } = useAccount();
  const [qr, setQr] = useState('');
  useEffect(() => {
    if (!address) { setQr(''); return; }
    QRCode.toDataURL(address, { width: 260, margin: 2, color: { dark: '#050607', light: '#f4f5f7' } }).then(setQr).catch(() => setQr(''));
  }, [address]);
  return <div className="money-panel">
    <div className="money-panel-head"><span>FUND WALLET</span><b>Receive crypto</b></div>
    <div className="money-wallet-grid">
      <div className="money-qr">{qr ? <img src={qr} alt="Wallet QR code" /> : <div className="money-qr-empty">Sign in to generate your wallet QR</div>}</div>
      <div className="money-wallet-details">
        <div><span>WALLET ADDRESS</span><b>{address || 'Wallet preparing…'}</b></div>
        <button type="button" onClick={() => address && navigator.clipboard?.writeText(address)} disabled={!address}>Copy address</button>
        <div className="money-note-block"><b>Top up with your bank</b><p>Use the supported bank funding rail to add value to your ROBANK wallet.</p></div>
      </div>
    </div>
  </div>;
}

export default function MoneyPage() {
  const [mode, setMode] = useState<Mode>('send');
  return <AppShell><div className="money-page">
    <div className="ro-page-head">
      <div><div className="ro-kicker">MONEY</div><h1>Move money.</h1><p>Send, fund your bank, or fund your wallet from one clean operating surface.</p></div>
    </div>
    <div className="money-primary-nav">
      {([['send','SEND','Transfer to a wallet or bank'],['fund-bank','FUND BANK','Move value into your bank rail'],['fund-wallet','FUND WALLET','Receive and top up your ROBANK wallet']] as const).map(([id,title,desc]) =>
        <button key={id} type="button" onClick={() => setMode(id)} className={mode===id?'active':''}><span>{title}</span><small>{desc}</small></button>
      )}
    </div>
    {mode==='send' && <section className="money-panel"><div className="money-panel-head"><span>SEND</span><b>Choose destination</b></div><p className="money-intro">Send supported value to a wallet or a bank beneficiary. The next step only asks for the details required for that destination.</p><SendForm /></section>}
    {mode==='fund-bank' && <section className="money-panel"><div className="money-panel-head"><span>FUND BANK</span><b>Choose how to add value</b></div><div className="money-choice-grid">
      <button type="button" className="money-choice active"><span>Top up with your bank</span><small>Buy supported crypto through the configured bank/on-ramp rail.</small></button>
      <button type="button" className="money-choice"><span>Top up with your crypto</span><small>Move supported crypto value into a connected bank payout rail when available.</small></button>
    </div><div className="money-provider-surface"><OnrampWidget /></div></section>}
    {mode==='fund-wallet' && <FundWalletPanel />}
  </div></AppShell>;
}
