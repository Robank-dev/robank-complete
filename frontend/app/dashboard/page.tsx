'use client';

import Link from 'next/link';
import AppShell, { Icon } from '@/components/AppShell';
import CopyButton from '@/components/CopyButton';
import Holdings from '@/components/Holdings';
import DashCard from '@/components/DashCard';
import RobankReel from '@/components/RobankReel';
import { Badge } from '@/components/ui';
import { short, usd } from '@/lib/format';
import { usePortfolio } from '@/lib/hooks/usePortfolio';
import { useRobankAccount } from '@/lib/hooks/useRobankAccount';

function Overview() {
  const account = useRobankAccount();
  const { data, loading, error, refresh } = usePortfolio(account.user?.id || '');

  const total = data ? usd(data.totalUsd) : null;

  return (
    <div className="ui-page">
      <RobankReel />
      <section className="ui-panel dash-hero">
        <div className="dash-hero-top">
          <span className="ui-kicker">Total balance</span>
          <Link href="/history" className="ui-btn ghost sm"><Icon name="clock" size={15} /> History</Link>
        </div>
        <strong className="dash-total" aria-live="polite">{total ?? (error ? '—' : <span className="ui-skel" style={{ display: 'inline-block', width: 220, height: 56 }} />)}</strong>
        <div className="dash-meta">
          {data && <Badge tone="ok">Robinhood Chain</Badge>}
          {data && data.unpricedCount > 0 && <span>{data.unpricedCount} holding{data.unpricedCount > 1 ? 's' : ''} without a price (not counted)</span>}
          {error && !data && <span className="ui-hint bad">{error}</span>}
        </div>
        <div className="dash-actions">
          <Link href="/send"><span><Icon name="up" /></span>Send</Link>
          <Link href="/receive"><span><Icon name="down" /></span>Receive</Link>
          <Link href="/card"><span><Icon name="card" /></span>Card</Link>
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
            <div className="ui-panel-head"><div><span className="ui-kicker">Wallets</span><h2>Your address</h2></div></div>
            <div className="ui-rows">
              <div className="ui-row"><span className="ui-token"><img src="/chain-icons/robinhood.svg" alt="" /></span><div className="ui-row-main"><b className="ui-mono">{account.evmAddress ? short(account.evmAddress, 8, 6) : 'Preparing…'}</b><span>Robinhood Chain</span></div>{account.evmAddress && <CopyButton value={account.evmAddress} compact label="Copy address" />}</div>
            </div>
            <p className="ui-muted" style={{ marginTop: 10 }}>Your wallet is self-custodial. ROBANK cannot move funds without your signature. Only send tokens on Robinhood Chain to this address.</p>
          </section>

          <DashCard />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return <AppShell><Overview /></AppShell>;
}
