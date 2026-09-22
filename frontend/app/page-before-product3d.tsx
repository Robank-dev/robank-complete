'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const features = [
  ['01', 'Your money, together', 'See your balance, move funds and keep track of everything from one place.'],
  ['02', 'A financial agent that listens', 'Ask for what you need in plain English. ROBANK turns your request into a clear action.'],
  ['03', 'Made for moving globally', 'Move digital dollars across borders while keeping your wallet and your decisions close.'],
];

export default function Home() {
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      document.documentElement.style.setProperty('--mx', `${x}`);
      document.documentElement.style.setProperty('--my', `${y}`);
    };

    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);
  return (
    <main className="site-shell">
      <nav className="top-nav">
        <Link href="/" className="brand"><span className="brand-mark"><img src="/robank-mark.png" alt="" /></span><span>ROBANK</span></Link>
        <div className={`nav-links ${menu ? 'open' : ''}`}>
          <a href="#product">Product</a><a href="#agent">AI Agent</a><a href="#card">Card</a><a href="#security">Security</a>
        </div>
        <div className="nav-actions"><Link href="/dashboard" className="nav-login">Sign in</Link><Link href="/dashboard" className="button button-small">Get started <span>â†—</span></Link></div>
        <button className="menu-button" onClick={() => setMenu(v => !v)} aria-label="Open menu">â˜°</button>
      </nav>

      <section className="hero-section">
        <div className="hero-grid" />
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />
        <div className="hero-particles" />
        <div className="hero-light-beam" />

        <div className="hero-copy">
          <div className="eyebrow hero-reveal">
            <span className="pulse-dot" />
            A new way to move money
          </div>

          <h1 className="hero-title hero-reveal">
            Money should
            <br />
            <span className="hero-word-wrap">
              <span className="outline-word">move</span>
              <span className="hero-word-glow">move</span>
            </span>
            with you.
          </h1>

          <p className="hero-lead hero-reveal">
            Your wallet, payments and personal financial agent —
            <br className="desktop-break" />
            together in one calm place.
          </p>

          <div className="hero-actions hero-reveal">
            <Link href="/dashboard" className="button">
              Open ROBANK <span>↗</span>
            </Link>
            <a href="#product" className="text-link">
              See how it works <span>↓</span>
            </a>
          </div>

          <div className="hero-note hero-reveal">
            <span>●</span>
            Self-controlled wallet · Built for a borderless world
          </div>
        </div>

        <div className="hero-visual hero-3d" aria-hidden="true">
          <div className="hero-device">

            <div className="hero-card-back">
              <div className="floating-card-shine" />
              <div className="floating-card-top">
                <span>ROBANK</span>
                <span>VIRTUAL</span>
              </div>
              <div className="floating-card-mark">
                <img src="/robank-mark.png" alt="" />
              </div>
              <div className="floating-card-number">
                •••• &nbsp; •••• &nbsp; •••• &nbsp; 4821
              </div>
              <div className="floating-card-bottom">
                <span>RO BANK MEMBER</span>
                <b>VISA</b>
              </div>
            </div>

            <div className="phone">
              <div className="phone-frame">
                <div className="phone-speaker" />

                <div className="phone-screen">
                  <div className="phone-top">
                    <span>ROBANK</span>
                    <span>•••</span>
                  </div>

                  <div className="phone-greeting">
                    <small>GOOD MORNING</small>
                    <b>Welcome back</b>
                  </div>

                  <div className="phone-balance-box">
                    <div>
                      <span>TOTAL BALANCE</span>
                      <strong>$12,840.52</strong>
                    </div>
                    <div className="balance-change">+8.42%</div>
                  </div>

                  <div className="phone-chart">
                    <svg viewBox="0 0 300 90" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartFade" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="white" stopOpacity=".25" />
                          <stop offset="100%" stopColor="white" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0 72 C22 66 28 70 45 55 S73 63 91 48 S119 55 137 34 S166 46 184 29 S213 35 231 20 S265 28 300 7 L300 90 L0 90Z"
                        fill="url(#chartFade)"
                      />
                      <path
                        d="M0 72 C22 66 28 70 45 55 S73 63 91 48 S119 55 137 34 S166 46 184 29 S213 35 231 20 S265 28 300 7"
                        fill="none"
                        stroke="rgba(255,255,255,.9)"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>

                  <div className="phone-actions">
                    <div>
                      <b>↗</b>
                      <span>Send</span>
                    </div>
                    <div>
                      <b>↓</b>
                      <span>Receive</span>
                    </div>
                    <div>
                      <b>↔</b>
                      <span>Swap</span>
                    </div>
                  </div>

                  <div className="phone-section-head">
                    <span>YOUR PORTFOLIO</span>
                    <small>View all →</small>
                  </div>

                  <div className="portfolio-row">
                    <div className="asset-icon usdt-icon"><img src="https://cdn.simpleicons.org/tether/26A17B" alt="USDT" /></div>
                    <div className="asset-name">
                      <b>USDT</b>
                      <span>Digital Dollar</span>
                    </div>
                    <div className="asset-value">
                      <b>$4,820.00</b>
                      <span>37.5%</span>
                    </div>
                  </div>

                  <div className="portfolio-row">
                    <div className="asset-icon">U</div>
                    <div className="asset-name">
                      <b>USDC</b>
                      <span>Digital Dollar</span>
                    </div>
                    <div className="asset-value">
                      <b>$3,940.52</b>
                      <span>30.7%</span>
                    </div>
                  </div>

                  <div className="portfolio-row">
                    <div className="asset-icon">Ξ</div>
                    <div className="asset-name">
                      <b>ETH</b>
                      <span>Ethereum</span>
                    </div>
                    <div className="asset-value">
                      <b>$2,180.00</b>
                      <span>17.0%</span>
                    </div>
                  </div>

                  <div className="phone-bottom-nav">
                    <div className="active"><b>⌂</b><span>Home</span></div>
                    <div><b>◫</b><span>Activity</span></div>
                    <div><b>◎</b><span>Agent</span></div>
                    <div><b>⚙</b><span>Settings</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="hero-phone-reflection" />

          </div>

          <div className="hero-data-chip chip-balance">
            <span>USDC BALANCE</span>
            <b>+$2,840.00</b>
          </div>

          <div className="hero-data-chip chip-agent">
            <span className="tiny-dot" />
            <div>
              <span>AI AGENT</span>
              <b>READY TO ACT</b>
            </div>
          </div>
<div className="hero-orbit-line orbit-a" />
          <div className="hero-orbit-line orbit-b" />
        </div>
      </section>

      <section className="ticker"><div className="ticker-track"><div className="ticker-set"><span>YOUR MONEY</span><b>•</b><span>YOUR AGENT</span><b>•</b><span>GLOBAL PAYMENTS</span><b>•</b><span>USDC</span><b>•</b><span>SELF-CUSTODY</span><b>•</b><span>NON-CUSTODIAL</span><b>•</b><span>AI FINANCE</span><b>•</b><span>BASE</span><b>•</b><span>ARBITRUM</span><b>•</b><span>YOUR WORLD</span><b>•</b><span>ROBANK</span><b>•</b></div><div className="ticker-set" aria-hidden="true"><span>YOUR MONEY</span><b>•</b><span>YOUR AGENT</span><b>•</b><span>GLOBAL PAYMENTS</span><b>•</b><span>USDC</span><b>•</b><span>SELF-CUSTODY</span><b>•</b><span>NON-CUSTODIAL</span><b>•</b><span>AI FINANCE</span><b>•</b><span>BASE</span><b>•</b><span>ARBITRUM</span><b>•</b><span>YOUR WORLD</span><b>•</b><span>ROBANK</span><b>•</b></div></div></section>

      <section id="product" className="section product-section">
        <div className="section-intro"><div className="section-kicker">THE PRODUCT</div><h2>Money, payments,<br /><em>all in one place.</em></h2><p>Everything stays simple when you use it. Underneath, ROBANK connects your wallet, payments and financial tools into one experience.</p></div>
        <div className="feature-grid">{features.map(([n,t,d]) => <article className="feature-card" key={n}><span className="feature-number">{n}</span><div className="feature-3d"><i /><i /><i /></div><h3>{t}</h3><p>{d}</p><a href="#agent">Explore <span>â†—</span></a></article>)}</div>
      </section>

      <section id="agent" className="section agent-section">
        <div className="agent-panel">
          <div className="agent-copy"><div className="section-kicker">ROBANK AI</div><h2>Just tell it<br /><em>what you need.</em></h2><p>No dashboards to decode. Ask naturally. Your personal agent can understand balances, payments, transfers and the next step.</p><div className="agent-command"><span>you</span> Send $20 to Alice <b>âŒ</b></div><div className="agent-response"><span>ROBANK AI</span><strong>Got it. I found Alice and prepared the payment.</strong><small>$20.00 USDC Â· Base Â· Ready to review</small></div><Link href="/agent" className="text-link">Meet your agent <span>â†—</span></Link></div>
          <div className="agent-visual"><div className="agent-sphere"><div className="sphere-core">R</div><div className="sphere-ring r-a" /><div className="sphere-ring r-b" /><div className="sphere-ring r-c" /><span className="sphere-node n1" /><span className="sphere-node n2" /><span className="sphere-node n3" /></div></div>
        </div>
      </section>

      <section id="card" className="section card-section">
        <div className="card-copy"><div className="section-kicker">THE ROBANK CARD</div><h2>Your digital wallet.<br /><em>In your pocket.</em></h2><p>A clean virtual card experience for everyday online payments, with the ROBANK interface sitting on top.</p><Link href="/dashboard" className="button">Preview the card <span>â†—</span></Link></div>
        <div className="card-stage"><div className="virtual-card"><div className="card-top"><span>ROBANK</span><span>VIRTUAL</span></div><div className="card-logo"><img src="/robank-mark.png" alt="" /></div><div className="card-number">â€¢â€¢â€¢â€¢ &nbsp;â€¢â€¢â€¢â€¢ &nbsp;â€¢â€¢â€¢â€¢ &nbsp;4821</div><div className="card-bottom"><span>ROBANK MEMBER</span><span>VISA</span></div></div><div className="card-shadow" /></div>
      </section>

      <section id="security" className="section security-section"><div className="security-orb" /><div className="section-kicker">CONTROL</div><h2>Quietly powerful.<br /><em>Clearly yours.</em></h2><p>ROBANK is designed around user-controlled wallets and transparent actions. The interface stays simple; the underlying rails do the heavy lifting.</p><div className="security-points"><span>01 / Self-controlled wallet</span><span>02 / Clear transaction previews</span><span>03 / Built for global payments</span></div></section>

      <footer className="footer"><div className="brand"><span className="brand-mark"><img src="/robank-mark.png" alt="" /></span><span>ROBANK</span></div><span>Your money without limits.</span><span>Â© 2026 ROBANK</span></footer>
    </main>
  );
}





