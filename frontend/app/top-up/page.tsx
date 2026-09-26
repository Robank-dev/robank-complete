'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import OnrampWidget from '@/components/OnrampWidget';

type Rail = 'bank' | 'crypto' | 'buvei' | 'mobile' | 'qr';

const rails = [
  { id: 'bank' as const, title: 'Bank / IDR', kicker: 'BANK FUNDING', copy: 'Use a connected bank or fiat payment rail when available.', icon: '↗', available: true },
  { id: 'crypto' as const, title: 'Crypto', kicker: 'CRYPTO TOP UP', copy: 'Fund ROBANK from a supported crypto asset and network.', icon: '◈', available: true },
  { id: 'buvei' as const, title: 'Buvei Card', kicker: 'VIRTUAL CARD', copy: 'Fund and spend through an eligible Buvei virtual card.', icon: '▣', available: true },
  { id: 'mobile' as const, title: 'Apple Pay / Google Pay', kicker: 'MOBILE PAY', copy: 'Use an eligible card in supported Apple Pay or Google Pay flows.', icon: '⌁', available: false },
  { id: 'qr' as const, title: 'QR Pay', kicker: 'QR PAYMENTS', copy: 'QR payment capability through the connected provider.', icon: '⌗', available: false }
];

export default function TopUpPage() {
  const [selected, setSelected] = useState<Rail | null>(null);

  return (
    <AppShell>
      <div className="topup-page">
        <div className="topup-head">
          <div><span className="ro-kicker">TOP UP</span><h1>Add funds.</h1><p>Choose a funding rail first. The selected rail opens only when you enter it.</p></div>
        </div>

        {!selected ? (
          <section className="topup-grid">
            {rails.map((rail) => (
              <button
                key={rail.id}
                type="button"
                className={rail.available ? 'topup-choice' : 'topup-choice disabled'}
                disabled={!rail.available}
                onClick={() => setSelected(rail.id)}
              >
                <span className="topup-choice-icon">{rail.icon}</span>
                <div><span>{rail.kicker}</span><b>{rail.title}</b><small>{rail.copy}</small></div>
                <em>{rail.available ? '→' : 'SOON'}</em>
              </button>
            ))}
          </section>
        ) : (
          <section className="topup-detail">
            <button type="button" className="topup-back" onClick={() => setSelected(null)}>← Back to funding rails</button>
            {selected === 'bank' && (
              <div className="topup-detail-card">
                <div className="topup-detail-head"><span className="ro-kicker">BANK / IDR</span><h2>Top up with your bank.</h2><p>ROBANK opens the currently configured funding provider. Available payment methods are determined by that provider connection.</p></div>
                <OnrampWidget />
              </div>
            )}
            {selected === 'crypto' && (
              <div className="topup-detail-card">
                <div className="topup-detail-head"><span className="ro-kicker">CRYPTO</span><h2>Top up from crypto.</h2><p>Choose the exact asset and network on Receive, then send it to your ROBANK deposit address.</p></div>
                <Link href="/receive" className="topup-primary-link">Open crypto deposit →</Link>
              </div>
            )}
            {selected === 'buvei' && (
              <div className="topup-detail-card">
                <div className="topup-detail-head"><span className="ro-kicker">BUVEI</span><h2>Card funding & spending.</h2><p>Buvei's public API supports virtual card issuing, card funding from its wallet, withdrawals, transaction monitoring and lifecycle controls. ROBANK's live Buvei credentials/rail are not connected in this UI yet.</p></div>
                <div className="topup-feature-list">
                  <div><b>Virtual cards</b><span>Issue and manage eligible Visa / Mastercard virtual cards through the provider.</span></div>
                  <div><b>Fund card</b><span>Move funds from the Buvei project wallet onto a card.</span></div>
                  <div><b>Online payments</b><span>Use an eligible card for supported merchants, subscriptions and services.</span></div>
                  <div><b>Mobile payments</b><span>Apple Pay / Google Pay support exists for eligible Buvei cards.</span></div>
                </div>
              </div>
            )}
            {(selected === 'mobile' || selected === 'qr') && <div className="topup-detail-card"><span className="ro-kicker">{selected === 'mobile' ? 'MOBILE PAY' : 'QR PAY'}</span><h2>Coming soon.</h2><p>This provider capability is present in the product plan but is not enabled in ROBANK yet.</p></div>}
          </section>
        )}
      </div>
    </AppShell>
  );
}
