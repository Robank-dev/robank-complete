'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AppShell, { Icon } from '@/components/AppShell';
import CopyButton from '@/components/CopyButton';
import Holdings from '@/components/Holdings';
import SystemBanner from '@/components/SystemBanner';
import { Badge, CapabilityBadge, Spinner } from '@/components/ui';
import { api, type Capability } from '@/lib/api';
import { relativeTime, short, usd } from '@/lib/format';
import { usePortfolio } from '@/lib/hooks/usePortfolio';
import { useRobankAccount } from '@/lib/hooks/useRobankAccount';

function Overview() {
  const account = useRobankAccount();
  const { data, loading, error, refresh } = usePortfolio(account.user?.id || '');
  const [caps, setCaps] = useState<Capability[] | null>(null);
  useEffect(() => { api.status().then((r) => setCaps(r.capabilities)).catch(() => setCaps([])); }, []);

  const failed = data?.sources.filter((s) => !s.ok) || [];
  const total = data ? usd(data.totalUsd) : null;

  return (
    <div className="ui-page">
      <SystemBanner />
      <section className="ui-panel dash-hero">
        <div className="dash-hero-top">
          <span className="ui-kicker">Total balance</span>
          <button type="button" className="ui-btn ghost sm" onClick={() => void refresh()} disabled={loading} aria-label="Refresh balances">{loading ? <Spinner /> : '↻'} {loading ? 'Updating' : 'Refresh'}</button>
        </div>
        <strong className="dash-total" aria-live="polite">{total ?? (error ? '—' : <span className="ui-skel" style={{ display: 'inline-block', width: 220, height: 56 }} />)}</strong>
        <div className="dash-meta">
          {data && <span>Updated {relativeTime(data.generatedAt)}</span>}
          {data && failed.length === 0 && <Badge tone="ok">All networks read</Badge>}
          {failed.length > 0 && <Badge tone="warn">{failed.map((f) => f.label).join(', ')} unavailable</Badge>}
          {data && data.unpricedCount > 0 && <span>{data.unpricedCount} holding{data.unpricedCount > 1 ? 's' : ''} without a price (not counted)</span>}
          {error && !data && <span className="ui-hint bad">{error}</span>}
        </div>
        {failed.length > 0 && data?.staleSources.length ? <p className="ui-hint warn">Showing your last confirmed balances for {data.staleSources.join(', ')} until the network responds.</p> : null}
        <div className="dash-actions">
          <Link href="/send"><span><Icon name="up" /></span>Send</Link>
          <Link href="/receive"><span><Icon name="down" /></span>Receive</Link>
          <Link href="/top-up"><span><Icon name="plus" /></span>Top up</Link>
          <Link href="/agent"><span><Icon name="spark" /></span>Ask agent</Link>
        </div>
      </section>

      <div className="ui-grid aside">
        <section className="ui-panel">
          <div className="ui-panel-head"><div><span className="ui-kicker">Assets</span><h2>Your holdings</h2></div>{data && <span className="ui-muted">{data.holdings.length} asset{data.holdings.length === 1 ? '' : 's'}</span>}</div>
          <Holdings holdings={data?.holdings || []} loading={loading} error={error} onRetry={() => void refresh()} />
        </section>

        <div className="ui-grid" style={{ alignContent: 'start' }}>
          <section className="ui-panel">
            <div className="ui-panel-head"><div><span className="ui-kicker">Wallets</span><h2>Your addresses</h2></div></div>
            <div className="ui-rows">
              <div className="ui-row"><span className="ui-token"><img src="/token-icons/ethereum.png" alt="" /></span><div className="ui-row-main"><b className="ui-mono">{account.evmAddress ? short(account.evmAddress, 8, 6) : 'Preparing…'}</b><span>EVM · Ethereum, Base, Arbitrum, Optimism, Polygon, BNB, Robinhood</span></div>{account.evmAddress && <CopyButton value={account.evmAddress} compact label="Copy EVM address" />}</div>
              <div className="ui-row"><span className="ui-token"><img src="/chain-icons/solana.svg" alt="" /></span><div className="ui-row-main"><b className="ui-mono">{account.solanaAddress ? short(account.solanaAddress, 8, 6) : 'Preparing…'}</b><span>Solana</span></div>{account.solanaAddress && <CopyButton value={account.solanaAddress} compact label="Copy Solana address" />}</div>
            </div>
            <p className="ui-muted" style={{ marginTop: 10 }}>These wallets are self-custodial. ROBANK cannot move funds without your signature.</p>
          </section>

          <section className="ui-panel">
            <div className="ui-panel-head"><div><span className="ui-kicker">Status</span><h2>What works today</h2></div></div>
            <div className="ui-rows">
              {caps === null ? <div className="ui-row"><Spinner /><span className="ui-muted">Checking…</span></div> : caps.filter((c) => !['auth', 'records'].includes(c.id)).map((c) => (
                <div className="ui-row" key={c.id}><div className="ui-row-main"><b>{c.label}</b><span>{c.detail}</span></div><CapabilityBadge state={c.state} /></div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return <AppShell><Overview /></AppShell>;
}
