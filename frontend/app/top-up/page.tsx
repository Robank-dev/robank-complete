'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { Alert, CapabilityBadge, Spinner } from '@/components/ui';
import { api, type Capability } from '@/lib/api';
import { chainById } from '@/lib/chains';
import { friendlyError } from '@/lib/errors';

const ONRAMP_CHAINS = [8453, 1, 42161, 10, 137, 1151111081099710];

function TopUp() {
  const [caps, setCaps] = useState<Capability[] | null>(null);
  const [chainId, setChainId] = useState(8453);
  const [amountInput, setAmountInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'bad' | 'ok'; text: string } | null>(null);
  useEffect(() => { api.status().then((r) => setCaps(r.capabilities)).catch(() => setCaps([])); }, []);
  const onramp = caps?.find((c) => c.id === 'onramp');
  const amountValue = Number(amountInput);
  const amountProblem = amountInput && (!Number.isFinite(amountValue) || amountValue < 20 || amountValue > 20000) ? 'Enter an amount between $20 and $20,000.' : '';

  async function openMoonPay() {
    if (busy || amountProblem) return;
    setBusy(true);
    setMessage(null);
    // Open the tab synchronously so pop-up blockers allow it, then point it at the signed URL.
    const tab = window.open('about:blank', '_blank');
    try {
      const { url } = await api.onrampUrl({ chainId, asset: 'USDC', amount: amountInput || undefined });
      if (tab) { tab.opener = null; tab.location.href = url; } else window.location.href = url;
      setMessage({ tone: 'ok', text: 'MoonPay opened in a new tab. Funds arrive in your ROBANK wallet once MoonPay completes the purchase — usually a few minutes.' });
    } catch (error) {
      tab?.close();
      setMessage({ tone: 'bad', text: friendlyError(error, 'MoonPay could not be opened.') });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ui-grid two">
      <section className="ui-panel">
        <div className="ui-panel-head"><div><span className="ui-kicker">From crypto</span><h2>Deposit from another wallet or exchange</h2></div><CapabilityBadge state="live" /></div>
        <p className="ui-text">Send USDC, USDT, USDG or gas tokens from any wallet or exchange to your ROBANK address. Always pick the same network on both sides.</p>
        <Link href="/receive" className="ui-btn primary" style={{ marginTop: 16 }}>Show my deposit address</Link>
      </section>

      <section className="ui-panel">
        <div className="ui-panel-head"><div><span className="ui-kicker">Card or bank</span><h2>Buy USDC with MoonPay</h2></div>{onramp ? <CapabilityBadge state={onramp.state} /> : <Spinner />}</div>
        {onramp?.state === 'live' ? (
          <div className="ui-grid" style={{ gap: 12 }}>
            <div className="ui-seg" aria-label="Network">{ONRAMP_CHAINS.map((id) => <button key={id} type="button" className={chainId === id ? 'active' : ''} onClick={() => setChainId(id)}>{chainById(id)!.label}</button>)}</div>
            <label className="ui-field"><span className="ui-label">Amount in USD <em>optional</em></span><input className={`ui-input${amountProblem ? ' invalid' : ''}`} value={amountInput} inputMode="decimal" placeholder="100" onChange={(e) => setAmountInput(e.target.value.replace(/[^0-9.]/g, '').slice(0, 8))} /></label>
            {amountProblem && <p className="ui-hint bad">{amountProblem}</p>}
            <button type="button" className="ui-btn primary" disabled={busy || Boolean(amountProblem)} onClick={() => void openMoonPay()}>{busy ? <><Spinner /> Opening…</> : 'Continue to MoonPay'}</button>
            <p className="ui-muted">MoonPay handles payment, identity checks and fees, and shows the final price before you pay. USDC is delivered straight to your own wallet.</p>
          </div>
        ) : onramp ? <p className="ui-text">Card and bank purchases are not enabled on ROBANK yet. Until then, deposit crypto from another wallet or exchange.</p> : null}
        {message && <div style={{ marginTop: 12 }}><Alert tone={message.tone}>{message.text}</Alert></div>}
      </section>

      <section className="ui-panel" style={{ gridColumn: '1 / -1' }}>
        <span className="ui-kicker">Not available yet</span>
        <div className="ui-rows" style={{ marginTop: 8 }}>
          {(caps || []).filter((c) => ['card', 'mobile-pay', 'qr-pay', 'bank-payout'].includes(c.id)).map((c) => (
            <div className="ui-row" key={c.id}><div className="ui-row-main"><b>{c.label}</b><span>{c.detail}</span></div><CapabilityBadge state={c.state} /></div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function TopUpPage() {
  return (
    <AppShell>
      <div className="ui-page">
        <header className="ui-head"><div><span className="ui-kicker">Top up</span><h1>Add funds</h1><p>Deposit crypto you already own, or buy USDC with a card or bank transfer when MoonPay is enabled.</p></div></header>
        <TopUp />
      </div>
    </AppShell>
  );
}
