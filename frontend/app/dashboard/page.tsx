'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import AssetList from '@/components/AssetList';

const activity = [
  ['Capital deposit', 'USDC · Base', '+$8,000.00', 'Today, 10:42'],
  ['RWA position', 'Centrifuge · Base', '+$2,400.00', 'Yesterday'],
  ['Card payment', 'Buvei · Card', '-$128.40', 'Yesterday'],
  ['Asset rebalance', 'Stock Tokens', '-$640.00', 'Sep 18']
];

const assets = [
  ['USDC', 'Base', '$18,420.00', 'Liquidity'],
  ['GLDx', 'Base', '$8,240.00', 'RWA / Gold'],
  ['AAPL', 'Robinhood Chain', '$6,820.00', 'Stock Token'],
  ['TSMx', 'Base', '$4,760.00', 'Stock Token']
];

const jobs = [
  ['LIQUIDITY', 'Maintaining $10,000 minimum', 'ACTIVE'],
  ['CREDIT', 'Watching collateral health', 'ACTIVE'],
  ['ASSETS', 'Monitoring 4 positions', 'ACTIVE'],
  ['RECONCILIATION', 'All rails synchronized', 'OK']
];

export default function Dashboard() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const wallet = wallets.find((item) => item.walletClientType === 'privy');

  useEffect(() => {
    if (ready && !authenticated) window.location.replace('/login');
  }, [ready, authenticated]);

  if (!ready || !authenticated) return null;

  return (
    <main className="app-page">
      <header className="app-top">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <img src="/robank-mark.png" alt="" />
          </span>
          ROBANK
        </Link>

        <div className="app-search">
          Search anything <kbd>⌘ K</kbd>
        </div>

        <div className="app-user" title={wallet?.address ?? undefined}>
          <span className="status-dot" />
          {user?.email?.address ?? 'ROBANK user'}
          <span className="avatar">{(user?.email?.address?.[0] ?? 'R').toUpperCase()}</span>
        </div>
      </header>

      <div className="app-layout">
        <aside className="app-side">
          <div className="side-label">ROBANK</div>

          <Link className="active" href="/dashboard">Overview</Link>
          <Link href="/agent">AI Agent</Link>

          <div className="side-label lower">CAPITAL</div>
          <Link href="#capital">Capital</Link>
          <Link href="#credit">Borrow</Link>
          <Link href="#assets">Assets</Link>
          <Link href="#activity">Activity</Link>

          <div className="side-label lower">OPERATE</div>
          <Link href="/send">Payments</Link>
          <Link href="#card">Card</Link>
          <Link href="/vault">Vault</Link>

          <div className="side-label lower">NETWORK</div>
          <Link href="/company">Company</Link>
          <Link href="/markets">Markets</Link>
          <Link href="/news">News</Link>
          <Link href="/jobs">Jobs</Link>

          <div className="side-bottom">
            <span>BASE + ROBINHOOD</span>
            <small>Mainnet rails · Base + Robinhood</small>
          </div>
        </aside>

        <section className="app-content">
          <div className="app-heading">
            <div>
              <div className="section-kicker">CAPITAL OVERVIEW</div>
              <h1>Your capital, operating.</h1>
              <p>ROBANK Agent is monitoring your financial position.</p>
            </div>

            <Link href="/agent" className="button">
              Open Agent →
            </Link>
          </div>

          <div className="capital-hero" id="capital">
            <div>
              <div className="card-label">TOTAL CAPITAL <span>USD</span></div>
              <div className="big-balance">
                $48,240<span>.00</span>
              </div>

              <div className="capital-breakdown">
                <div>
                  <span>LIQUID</span>
                  <b>$18,420</b>
                </div>
                <div>
                  <span>INVESTED</span>
                  <b>$29,820</b>
                </div>
                <div>
                  <span>DEBT</span>
                  <b>$4,200</b>
                </div>
                <div>
                  <span>NET CAPITAL</span>
                  <b>$44,040</b>
                </div>
              </div>
            </div>

            <div className="capital-power">
              <span className="capital-power-label">CAPITAL POWER</span>
              <strong>$18,750</strong>
              <small>Available liquidity + credit capacity</small>
              <Link href="#credit">View credit →</Link>
            </div>
          </div>

          <div className="capital-grid">
            <div className="capital-panel" id="credit">
              <div className="panel-head">
                <div>
                  <div className="card-label">CREDIT POWER</div>
                  <h3>Borrow against eligible capital.</h3>
                </div>
                <span className="panel-status">READY</span>
              </div>

              <div className="credit-number">$15,000</div>

              <div className="credit-meta">
                <span>
                  <small>COLLATERAL</small>
                  <b>$32,400</b>
                </span>
                <span>
                  <small>DEBT</small>
                  <b>$4,200</b>
                </span>
                <span>
                  <small>LTV</small>
                  <b>13.0%</b>
                </span>
              </div>

              <div className="panel-actions">
                <Link href="#borrow" className="button">Borrow</Link>
                <Link href="#credit" className="text-link">View credit →</Link>
              </div>
            </div>

            <div className="capital-panel autopilot-panel">
              <div className="panel-head">
                <div>
                  <div className="card-label">AUTOPILOT</div>
                  <h3>ROBANK Agent is working.</h3>
                </div>
                <span className="live-pill">● ACTIVE</span>
              </div>

              <div className="job-list">
                {jobs.map((job) => (
                  <div className="job-row" key={job[0]}>
                    <div>
                      <b>{job[0]}</b>
                      <span>{job[1]}</span>
                    </div>
                    <small>{job[2]}</small>
                  </div>
                ))}
              </div>

              <Link href="/agent" className="text-link">Open autonomy center →</Link>
            </div>
          </div>

          <div className="capital-grid lower-grid">
            <div className="capital-panel" id="assets">
              <div className="panel-head">
                <div>
                  <div className="card-label">ASSETS</div>
                  <h3>What ROBANK is managing.</h3>
                </div>
                <Link href="#assets" className="text-link">View all →</Link>
              </div>

              <AssetList />
            </div>

            <div className="capital-panel" id="borrow">
              <div className="panel-head">
                <div>
                  <div className="card-label">BORROW</div>
                  <h3>Unlock liquidity without selling.</h3>
                </div>
              </div>

              <p className="panel-copy">
                Use eligible assets as collateral and access liquidity through connected lending rails.
              </p>

              <div className="borrow-rule">
                <span>Current LTV</span>
                <b>13.0%</b>
              </div>

              <div className="borrow-rule">
                <span>Configured maximum</span>
                <b>50.0%</b>
              </div>

              <Link href="#credit" className="button panel-button">Review borrowing power</Link>
            </div>
          </div>

          <div className="capital-grid lower-grid">
            <div className="capital-panel" id="activity">
              <div className="panel-head">
                <div>
                  <div className="card-label">RECENT ACTIVITY</div>
                  <h3>Latest capital movement.</h3>
                </div>
                <Link href="#activity" className="text-link">View all →</Link>
              </div>

              <div className="activity-list">
                {activity.map((item) => (
                  <div className="tx" key={item[0]}>
                    <div className="tx-icon">{item[0][0]}</div>
                    <div className="tx-name">
                      <b>{item[0]}</b>
                      <span>{item[1]}</span>
                    </div>
                    <div className="tx-amount">
                      <b>{item[2]}</b>
                      <span>{item[3]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="capital-panel" id="card">
              <div className="panel-head">
                <div>
                  <div className="card-label">SPENDING</div>
                  <h3>Buvei Card</h3>
                </div>
                <span className="panel-status">PROVIDER</span>
              </div>

              <div className="mini-card">
                <div>ROBANK <span>VIRTUAL</span></div>
                <strong>•••• 4821</strong>
                <small>VISA</small>
              </div>

              <div className="card-spend-meta">
                <span>Available</span>
                <b>$2,860</b>
              </div>

              <Link href="#card" className="text-link">Manage spending rail →</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}