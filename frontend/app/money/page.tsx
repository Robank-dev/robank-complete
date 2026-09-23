'use client';

import { useState } from 'react';
import AppShell from '@/components/AppShell';
import SendForm from '@/components/SendForm';
import ReceiveCard from '@/components/ReceiveCard';
import OnrampWidget from '@/components/OnrampWidget';

const modes = [
  ['bank-to-crypto', 'Bank → Crypto', 'Top up your ROBANK wallet from a supported bank rail.'],
  ['crypto-to-bank', 'Crypto → Bank', 'Move supported crypto value back to your bank rail.'],
  ['send', 'Send', 'Send supported assets to another wallet.'],
  ['receive', 'Receive', 'Receive assets into your ROBANK wallet.'],
] as const;

export default function MoneyPage() {
  const [mode, setMode] = useState<(typeof modes)[number][0]>('bank-to-crypto');

  return (
    <AppShell>
      <div className="money-page">
        <div className="ro-page-head">
          <div>
            <div className="ro-kicker">MONEY</div>
            <h1>Move money.</h1>
            <p>One place for bank rails, crypto rails and wallet transfers.</p>
          </div>
        </div>

        <div className="money-mode-grid">
          {modes.map(([id, title, description]) => (
            <button key={id} type="button" onClick={() => setMode(id)} className={mode === id ? 'money-mode active' : 'money-mode'}>
              <span>{title}</span>
              <small>{description}</small>
            </button>
          ))}
        </div>

        <section className="money-workspace">
          {mode === 'bank-to-crypto' && (
            <div>
              <div className="money-workspace-head"><span>BANK → CRYPTO</span><b>On-ramp</b></div>
              <p className="money-note">Choose an amount and continue through the configured on-ramp provider.</p>
              <OnrampWidget />
            </div>
          )}
          {mode === 'crypto-to-bank' && (
            <div className="money-unavailable">
              <span className="ro-kicker">CRYPTO → BANK</span>
              <h2>Bank payout rail is not connected yet.</h2>
              <p>ROBANK can show this flow here once an offramp/bank provider is configured. No fake payout action is exposed.</p>
            </div>
          )}
          {mode === 'send' && (
            <div>
              <div className="money-workspace-head"><span>WALLET → WALLET</span><b>Send</b></div>
              <SendForm />
            </div>
          )}
          {mode === 'receive' && (
            <div>
              <div className="money-workspace-head"><span>INBOUND</span><b>Receive</b></div>
              <ReceiveCard />
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
