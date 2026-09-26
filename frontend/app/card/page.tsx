'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { Alert, CapabilityBadge, Spinner } from '@/components/ui';
import { api, type Capability } from '@/lib/api';
import { friendlyError } from '@/lib/errors';

function Card() {
  const [caps, setCaps] = useState<Capability[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null);
  useEffect(() => { api.status().then((r) => setCaps(r.capabilities)).catch(() => setCaps([])); }, []);
  const card = caps?.find((c) => c.id === 'card');
  const kyc = caps?.find((c) => c.id === 'kyc');

  async function verify() {
    setBusy(true);
    setMessage(null);
    const tab = window.open('about:blank', '_blank');
    try {
      const { url } = await api.kycSession();
      if (tab) { tab.opener = null; tab.location.href = url; } else window.location.href = url;
      setMessage({ tone: 'ok', text: 'Verification opened in a new tab. Complete it there; ROBANK does not see your documents.' });
    } catch (error) {
      tab?.close();
      setMessage({ tone: 'bad', text: friendlyError(error, 'Verification could not be started.') });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ui-grid aside">
      <section className="ui-panel card-stage-panel">
        <div className="card-stage"><div className="virtual-card card-muted">
          <div className="card-top"><span>ROBANK</span><span>DEBIT</span></div>
          <div className="card-logo"><img src="/robank-mark.png" alt="" /></div>
          <div className="card-number">••••  ••••  ••••  ••••</div>
          <div className="card-bottom"><span>NOT ISSUED</span><span>ROBANK CARD</span></div>
        </div></div>
      </section>
      <section className="ui-panel" style={{ alignSelf: 'start' }}>
        <div className="ui-panel-head"><div><span className="ui-kicker">ROBANK Card</span><h2>Spend your balance anywhere</h2></div>{card ? <CapabilityBadge state={card.state} /> : <Spinner />}</div>
        <p className="ui-text">The ROBANK Card is not available yet. No card can be ordered, funded or used today, and nothing is charged.</p>
        <div className="ui-kv" style={{ marginTop: 14 }}>
          <div><span>Status</span><b>Not issued</b></div>
          <div><span>Card program</span><b>Not connected</b></div>
          <div><span>Fees & limits</span><b>Published before launch</b></div>
          <div><span>Identity check</span><b>{kyc?.state === 'live' ? 'Available now' : 'Not enabled yet'}</b></div>
        </div>
        <div className="ui-grid" style={{ gap: 10, marginTop: 16 }}>
          {kyc?.state === 'live' && <button type="button" className="ui-btn secondary" disabled={busy} onClick={() => void verify()}>{busy ? <><Spinner /> Opening…</> : 'Verify my identity in advance'}</button>}
          {message && <Alert tone={message.tone}>{message.text}</Alert>}
          <p className="ui-muted">Meanwhile, you can hold and send your balance on-chain. <Link className="ui-link" href="/send">Send funds</Link></p>
        </div>
      </section>
    </div>
  );
}

export default function CardPage() {
  return (
    <AppShell>
      <div className="ui-page">
        <header className="ui-head"><div><span className="ui-kicker">Card</span><h1>ROBANK Card</h1><p>A debit card for your stablecoin balance is planned. This page shows its real status — it will not pretend a card exists.</p></div></header>
        <Card />
      </div>
    </AppShell>
  );
}
