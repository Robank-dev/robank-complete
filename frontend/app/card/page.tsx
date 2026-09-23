'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

type CardState = Awaited<ReturnType<typeof api.cardStatus>>['card'];

export default function CardPage() {
  const [card, setCard] = useState<CardState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.cardStatus()
      .then((data) => setCard(data.card))
      .catch(() => setCard(null))
      .finally(() => setLoading(false));
  }, []);

  const status = card?.status ?? (loading ? 'loading' : 'unavailable');
  const active = status === 'active' || status === 'issued';

  return (
    <AppShell>
      <div className="card-page">
        <div className="ro-page-head card-page-head">
          <div>
            <div className="ro-kicker">ROBANK / CARD</div>
            <h1>Spending rail.</h1>
            <p>A clean card surface for spending from your ROBANK capital when the provider rail is connected.</p>
          </div>
          <Link href="/money" className="card-back-link">Move money <span>→</span></Link>
        </div>

        <section className="card-hero-grid">
          <div className="card-showcase">
            <div className="card-showcase-top">
              <span>ROBANK VIRTUAL</span>
              <span>{active ? 'ACTIVE' : 'PROVIDER RAIL'}</span>
            </div>
            <div className="card-stage">
              <div className="card-3d-wrap">
                <div className="card-glow" />
                <div className="virtual-card">
                  <div className="card-surface">
                    <div className="card-top"><span>ROBANK</span><span>FINANCIAL CARD</span></div>
                    <div className="card-chip"><span /><span /></div>
                    <div className="card-logo"><img src="/robank-mark.png" alt="ROBANK" /></div>
                    <div className="card-number">•••• &nbsp; •••• &nbsp; •••• &nbsp; 4821</div>
                    <div className="card-meta">
                      <div><small>CARDHOLDER</small><strong>ROBANK ACCOUNT</strong></div>
                      <div><small>EXPIRES</small><strong>12/28</strong></div>
                      <div><small>TYPE</small><strong>DIGITAL</strong></div>
                    </div>
                    <div className="card-bottom"><span>ROBANK</span><span>PRIVATE · DIGITAL</span></div>
                    <div className="card-shine" />
                  </div>
                </div>
              </div>
            </div>
            <div className="card-showcase-note">
              <span className={active ? 'card-live-dot active' : 'card-live-dot'} />
              <div><b>{active ? 'Card rail active' : 'Card rail not active'}</b><small>{card?.providerName || 'Provider connection required for live issuance.'}</small></div>
            </div>
          </div>

          <div className="card-status-panel">
            <div className="ro-kicker">CARD STATUS</div>
            <h2>{active ? 'Ready to spend.' : 'Not issued yet.'}</h2>
            <p>{active ? 'Your card provider is reporting an active card rail.' : 'The UI is ready, but issuance and funding remain provider-dependent. ROBANK does not expose fake card actions.'}</p>
            <div className="card-status-list">
              <div><span>Status</span><b>{String(status).toUpperCase()}</b></div>
              <div><span>Card type</span><b>Virtual</b></div>
              <div><span>Provider</span><b>{card?.providerName || 'Not connected'}</b></div>
              <div><span>Issuance</span><b>{card?.operations?.issue ? 'Available' : 'Provider-dependent'}</b></div>
              <div><span>Funding</span><b>{card?.operations?.fund ? 'Available' : 'Provider-dependent'}</b></div>
            </div>
            <Link href="/agent" className="card-policy-link">Open Agent policy <span>→</span></Link>
          </div>
        </section>

        <section className="card-lower-grid">
          <div className="card-info-panel">
            <div className="ro-kicker">SPENDING CONTROL</div>
            <h3>One rail, clear controls.</h3>
            <p>When a supported provider is connected, card status, funding and spending policy can live here without mixing provider state with your onchain wallet.</p>
            <div className="card-feature-row"><span>01</span><div><b>Provider status</b><small>See whether issuance and funding are available.</small></div></div>
            <div className="card-feature-row"><span>02</span><div><b>Agent policy</b><small>Review spending intent before execution.</small></div></div>
            <div className="card-feature-row"><span>03</span><div><b>Money rail</b><small>Move between supported bank and crypto rails from one place.</small></div></div>
          </div>

          <div className="card-activity-panel">
            <div className="card-panel-head"><div><div className="ro-kicker">ACTIVITY</div><h3>Recent card activity</h3></div><span>NO LIVE ACTIVITY</span></div>
            <div className="card-empty-activity">Live card activity will appear here when the card provider connection is configured.</div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
