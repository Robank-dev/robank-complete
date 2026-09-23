'use client';

import Link from 'next/link';
import AppShell from '@/components/AppShell';
import AssetList from '@/components/AssetList';
import { usePrivy, useWallets } from '@privy-io/react-auth';

export default function Dashboard() {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const wallet = wallets.find((item) => item.walletClientType === 'privy');
  const address = wallet?.address;

  return (
    <AppShell>
      <div className="ro-page-head">
        <div>
          <div className="ro-kicker">CAPITAL OVERVIEW</div>
          <h1>Your capital, operating.</h1>
          <p>One account for your on-chain capital across Base and Robinhood Chain.</p>
        </div>
        <Link href="/agent" className="ro-primary">Open Agent <span>→</span></Link>
      </div>

      <section className="ro-overview-hero">
        <div className="ro-hero-copy">
          <span className="ro-eyebrow">ACCOUNT</span>
          <h2>{user?.email?.address ?? 'ROBANK account'}</h2>
          <p>{address ? `${address.slice(0, 8)}…${address.slice(-6)}` : 'Privy wallet loading'}</p>
        </div>
        <div className="ro-network-stack">
          <div><span className="ro-live-dot" /> BASE</div>
          <div><span className="ro-live-dot" /> ROBINHOOD</div>
          <small>MAINNET RAILS</small>
        </div>
      </section>

      <section className="ro-stat-grid">
        <div className="ro-stat"><span>WALLET</span><strong>{address ? 'READY' : 'LOADING'}</strong><small>Privy embedded wallet</small></div>
        <div className="ro-stat"><span>BASE</span><strong>ETH · USDC</strong><small>Live balance reads</small></div>
        <div className="ro-stat"><span>ROBINHOOD</span><strong>ETH · USDG</strong><small>Live balance reads</small></div>
        <div className="ro-stat"><span>AUTONOMY</span><strong>READY</strong><small>Open the agent terminal</small></div>
      </section>

      <section className="ro-content-grid">
        <div className="ro-panel ro-assets-panel">
          <div className="ro-panel-head"><div><span className="ro-kicker">ASSETS</span><h3>Your on-chain balances.</h3></div><span className="ro-panel-note">LIVE</span></div>
          {address ? <AssetList /> : <div className="ro-empty">Your Privy wallet is loading.</div>}
        </div>
        <div className="ro-panel">
          <div className="ro-panel-head"><div><span className="ro-kicker">AUTONOMY</span><h3>Let ROBANK operate.</h3></div><span className="ro-panel-note">AGENT</span></div>
          <p className="ro-copy">Review balances, prepare wallet transfers and execute approved actions from one terminal.</p>
          <div className="ro-command-preview"><span>robank-agent</span><b>READY</b><code>what's my balance</code></div>
          <Link href="/agent" className="ro-text-link">Open autonomy center <span>→</span></Link>
        </div>
      </section>

      <section className="ro-panel ro-activity-panel">
        <div className="ro-panel-head"><div><span className="ro-kicker">ACTIVITY</span><h3>Recent capital movement.</h3></div></div>
        <div className="ro-empty"><strong>No activity yet.</strong><span>Confirmed transactions will appear here after execution and reconciliation.</span></div>
      </section>
    </AppShell>
  );
}
