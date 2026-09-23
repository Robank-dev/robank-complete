'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import AppShell from '@/components/AppShell';
import SendForm from '@/components/SendForm';
import OnrampWidget from '@/components/OnrampWidget';
import { useAccount } from 'wagmi';

type Mode = 'send' | 'fund-bank' | 'fund-wallet';
type BankFundingMode = 'bank' | 'crypto';

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
  const [bankFundingMode, setBankFundingMode] = useState<BankFundingMode>('bank');
  return <AppShell><div className="money-page">
    <div className="ro-page-head">
      <div><div className="ro-kicker">MONEY</div><h1>Move money.</h1><p>Send value, fund your bank, or fund your wallet from one place.</p></div>
    </div>
    <div className="money-primary-nav">
      {([['send','SEND','Wallet or bank'],['fund-bank','FUND BANK','Add value to your bank'],['fund-wallet','FUND WALLET','Add crypto to your wallet']] as const).map(([id,title,desc]) =>
        <button key={id} type="button" onClick={() => setMode(id)} className={mode===id?'active':''}><span>{title}</span><small>{desc}</small></button>
      )}
    </div>
    {mode==='send' && <section className="money-panel"><div className="money-panel-head"><span>SEND</span><b>Where should it go?</b></div><p className="money-intro">Choose a wallet or bank, then enter the recipient, asset and amount.</p><SendForm /></section>}
    {mode==='fund-bank' && <section className="money-panel"><div className="money-panel-head"><span>FUND BANK</span><b>Choose your funding rail</b></div>
      <div className="money-choice-grid">
        <button type="button" onClick={() => setBankFundingMode('bank')} className={bankFundingMode==='bank'?'money-choice active':'money-choice'}><span>Top up with your bank</span><small>Use a supported bank or payment method through the connected provider.</small></button>
        <button type="button" onClick={() => setBankFundingMode('crypto')} className={bankFundingMode==='crypto'?'money-choice active':'money-choice'}><span>Top up with your crypto</span><small>Use supported crypto to fund a bank payout when that rail is connected.</small></button>
      </div>
      {bankFundingMode==='bank' ? <div className="money-provider-surface"><OnrampWidget /></div> : <div className="money-provider-surface money-unavailable"><div className="ro-kicker">CRYPTO → BANK</div><h2>Bank payout rail</h2><p>Choose the bank beneficiary and asset when the connected payout provider is available. ROBANK will not simulate a bank transfer.</p></div>}
    </section>}
    {mode==='fund-wallet' && <FundWalletPanel />}
  </div></AppShell>;
}
