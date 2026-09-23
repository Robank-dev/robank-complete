'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const features = [
  ['01', 'One financial workspace', 'See account context, assets and activity together in one financial workspace.'],
  ['02', 'An agent that can operate', 'Turn natural-language intent into structured financial work while keeping policy and execution boundaries visible.'],
  ['03', 'Built beyond the browser', 'Use the app, ROBANK Skill, CLI and API as different surfaces over the same operating model.'],
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
        <div className={`nav-links ${menu ? "open" : ""}`}><a href="https://x.com/robank_co" target="_blank" rel="noreferrer">X</a><a href="#install">Install Skill</a><a href="/how-it-works">How it works</a><a href="/docs">Docs</a><a href="#agent">AI</a></div>
        <div className="nav-actions"><Link href="/login" className="button button-small">App</Link></div>
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

          <h1 className="hero-title hero-reveal">Turn your agent<br /><span className="hero-word-wrap"><span className="outline-word">into a</span> financial operator.</span></h1>

          <p className="hero-lead hero-reveal">Connect your agent to wallets, cards, payments and on-chain actions — then let it move, pay, and get things done wherever it runs.</p>

          <div className="hero-actions hero-reveal">
            <Link href="/dashboard" className="button hero-main-button">
              Open ROBANK <span>→</span>
            </Link>
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
                      <b>?</b>
                      <span>Send</span>
                    </div>
                    <div>
                      <b>?</b>
                      <span>Receive</span>
                    </div>
                    <div>
                      <b>?</b>
                      <span>Swap</span>
                    </div>
                  </div>

                  <div className="phone-section-head">
                    <span>YOUR PORTFOLIO</span>
                    <small>View all ?</small>
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
                    <div className="asset-icon">?</div>
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
                    <div className="active"><b>¦</b><span>Home</span></div>
                    <div><b>?</b><span>Activity</span></div>
                    <div><b>?</b><span>Agent</span></div>
                    <div><b>?</b><span>Settings</span></div>
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

            <section id="install" className="section install-section">
        <div className="install-header">
          <div>
            <div className="section-kicker">ROBANK AGENT SKILL</div>
            <h2>Install the Skill.<br /><em>Give your agent ROBANK context.</em></h2>
            <p>Install the ROBANK Skill to give compatible agents the current operating rules and references for account state, assets, payments, borrowing, cards, company, jobs, networks, security, x402, APIs and CLI workflows.</p>
          </div>
          <a className="install-github-link" href="https://github.com/Robank-dev/robank-skill" target="_blank" rel="noreferrer">VIEW ON GITHUB <span>→</span></a>
        </div>

        <div className="install-terminal">
          <div className="install-terminal-head">
            <div className="install-dots"><i /><i /><i /></div>
            <span>~ shell</span>
            <button type="button" onClick={() => navigator.clipboard?.writeText('npx skills add Robank-dev/robank-skill')}>COPY</button>
          </div>
          <div className="install-command"><b>$</b><span>npx skills add</span><strong>Robank-dev/robank-skill</strong></div>
          <div className="install-terminal-foot">
            <span>ROBANK SKILL</span>
            <span>AGENT-FIRST FINANCIAL CONTEXT</span>
            <span>WINDOWS / LINUX / MACOS</span>
          </div>
        </div>

        <div className="install-grid">
          <article className="install-card">
            <span className="install-card-kicker">01 / AGENT</span>
            <h3>Built for financial agents.</h3>
            <p>Structured context for account state, assets, payments, borrowing, company, jobs, policies, networks, security and execution concepts.</p>
            <a href="/docs#agent">READ AGENT DOCS <span>→</span></a>
          </article>

          <article className="install-card">
            <span className="install-card-kicker">02 / SKILL</span>
            <h3>One install. One reference layer.</h3>
            <p>The package includes the ROBANK Skill together with reference material covering the system's core financial concepts.</p>
            <a href="https://github.com/Robank-dev/robank-skill" target="_blank" rel="noreferrer">VIEW REPOSITORY <span>→</span></a>
          </article>

          <article className="install-card">
            <span className="install-card-kicker">03 / CAPABILITIES</span>
            <h3>Payments, assets, jobs &amp; more.</h3>
            <p>Explore the current ROBANK model across payments, assets, borrowing, cards, company, jobs, markets, news, RWA, networks, security, APIs and machine payments.</p>
            <a href="/docs">EXPLORE DOCS <span>→</span></a>
          </article>

          <article className="install-card">
            <span className="install-card-kicker">04 / DEVELOPERS</span>
            <h3>App, Skill, CLI &amp; API.</h3>
            <p>The same operating model is designed to work across the web app, ROBANK Skill, terminal and API instead of locking the agent to one interface.</p>
            <a href="/docs#developer">DEVELOPER DOCS <span>→</span></a>
          </article>
        </div>
      </section>
      <section className="ticker"><div className="ticker-track"><div className="ticker-set"><span>YOUR ACCOUNT</span><b>•</b><span>YOUR AGENT</span><b>•</b><span>PAYMENTS</span><b>•</b><span>USDC</span><b>•</b><span>SELF-CUSTODY</span><b>•</b><span>NON-CUSTODIAL</span><b>•</b><span>API + CLI</span><b>•</b><span>ROBINHOOD CHAIN</span><b>•</b><span>COMPANY · JOBS</span><b>•</b><span>YOUR WORLD</span><b>•</b><span>ROBANK</span><b>•</b></div><div className="ticker-set" aria-hidden="true"><span>YOUR ACCOUNT</span><b>•</b><span>YOUR AGENT</span><b>•</b><span>PAYMENTS</span><b>•</b><span>USDC</span><b>•</b><span>SELF-CUSTODY</span><b>•</b><span>NON-CUSTODIAL</span><b>•</b><span>API + CLI</span><b>•</b><span>ROBINHOOD CHAIN</span><b>•</b><span>COMPANY · JOBS</span><b>•</b><span>YOUR WORLD</span><b>•</b><span>ROBANK</span><b>•</b></div></div></section>

      <section id="product" className="section product-section">
        <div className="section-intro"><div className="section-kicker">THE PRODUCT</div><h2>Financial context,<br /><em>ready to act.</em></h2><p>ROBANK brings account state, assets, payments and financial workflows into one interface — then exposes the same operating model to agents.</p></div>
        <div className="feature-grid">{features.map(([n,t,d]) => <article className="feature-card" key={n}><span className="feature-number">{n}</span><div className="feature-image-wrap"><img src={n === '01' ? '/robank-wallet.png' : n === '02' ? '/robank-ai.png' : '/robank-global.png'} alt="" className="product-image" /></div><h3>{t}</h3><p>{d}</p><a href="#agent">Explore <span>?</span></a></article>)}</div>
      </section>      <section id="agent" className="section agent-section">

        <div className="agent-intro">
          <div className="section-kicker">ROBANK AI</div>
          <h2>Tell ROBANK what you need.<br /><em>Then let it work.</em></h2>
          <p>
            Use ROBANK naturally from the app or from your terminal.
            Ask for a payment, run an action, install a skill, or manage your wallet.
          </p>
        </div>

        <div className="agent-simulation-grid">

          {/* CLI */}
          <div className="cli-stage">
            <div className="cli-orbit cli-orbit-a" />
            <div className="cli-orbit cli-orbit-b" />

            <div className="cli-window">

              <div className="cli-header">
                <div className="cli-dots">
                  <i />
                  <i />
                  <i />
                </div>
                <span>ubuntu@robank</span>
                <small>bash</small>
              </div>

              <div className="cli-body">

                <div className="terminal-banner">
                  <span>ROBANK CLI</span>
                  <small>v0.1.0 · secure wallet interface</small>
                </div>

                <div className="terminal-command">
                  <span className="terminal-prompt">ubuntu@robank:~$</span>
                  <strong>robank send --to alice.robinhood --amount 20 --token USDC</strong>
                  <i className="terminal-cursor" />
                </div>

                <div className="terminal-output terminal-output-1">
                  <span className="terminal-arrow">?</span>
                  <span>loading wallet...</span>
                </div>

                <div className="terminal-output terminal-output-2">
                  <span className="terminal-success">?</span>
                  <span>wallet connected</span>
                </div>

                <div className="terminal-output terminal-output-3">
                  <span className="terminal-success">?</span>
                  <span>balance: <b>12,840.52 USDC</b></span>
                </div>

                <div className="terminal-output terminal-output-4">
                  <span className="terminal-arrow">?</span>
                  <span>resolving recipient...</span>
                </div>

                <div className="terminal-output terminal-output-5">
                  <span className="terminal-success">?</span>
                  <span>recipient: <b>alice.robinhood</b></span>
                </div>

                <div className="terminal-output terminal-output-6">
                  <span className="terminal-arrow">?</span>
                  <span>building transaction...</span>
                </div>

                <div className="terminal-detail terminal-detail-1">
                  <span>network</span>
                  <b>Robinhood Chain</b>
                </div>

                <div className="terminal-detail terminal-detail-2">
                  <span>amount</span>
                  <b>20 USDC</b>
                </div>

                <div className="terminal-detail terminal-detail-3">
                  <span>recipient</span>
                  <b>alice.robinhood</b>
                </div>

                <div className="terminal-output terminal-output-7">
                  <span className="terminal-arrow">?</span>
                  <span>signing transaction...</span>
                </div>

                <div className="terminal-output terminal-output-8">
                  <span className="terminal-arrow">?</span>
                  <span>broadcasting...</span>
                </div>

                <div className="terminal-success-box">
                  <div>
                    <span>?</span>
                    <strong>transaction confirmed</strong>
                  </div>
                  <small>status: success</small>
                </div>

                <div className="terminal-hash">
                  <span>tx:</span>
                  <b>0x7f91c8...a821</b>
                </div>

                <div className="terminal-next">
                  <span className="terminal-prompt">ubuntu@robank:~$</span>
                  <strong>robank skills</strong>
                  <i className="terminal-cursor" />
                </div>

              </div>

              <div className="cli-footer">
                <span>ROBANK CLI</span>
                <span>LINUX · BASH</span>
              </div>

            </div>
          </div>

          {/* AI */}
          <div className="ai-stage">
            <div className="ai-orbit ai-orbit-a" />
            <div className="ai-orbit ai-orbit-b" />

            <div className="ai-window">
              <div className="ai-window-header">
                <div className="ai-profile">
                  <span>R</span>
                  <div>
                    <strong>ROBANK AI</strong>
                    <small><i /> Online</small>
                  </div>
                </div>
                <div className="ai-menu">•••</div>
              </div>

              <div className="ai-feed">

                <div className="ai-step ai-user-step">
                  <small>YOU</small>
                  <div>Send $20 to Alice</div>
                </div>

                <div className="ai-step ai-thinking-step">
                  <span />
                  <div>Thinking</div>
                  <b><i /><i /><i /></b>
                </div>

                <div className="ai-step ai-response-step">
                  <small>ROBANK AI</small>
                  <strong>Got it. I'll prepare the payment.</strong>
                  <p>Checking recipient and available balance.</p>
                </div>

                <div className="ai-step ai-transaction-step">
                  <div className="ai-tx-head">
                    <span>PAYMENT READY</span>
                    <b>USDC</b>
                  </div>

                  <div className="ai-tx-amount">$20.00</div>

                  <div className="ai-tx-row">
                    <span>To</span>
                    <b>Alice</b>
                  </div>

                  <div className="ai-tx-row">
                    <span>Network</span>
                    <b>Robinhood Chain</b>
                  </div>

                  <button>Confirm &amp; send <span>?</span></button>
                </div>

                <div className="ai-step ai-success-step">
                  <span>?</span>
                  <div>
                    <strong>Payment complete</strong>
                    <small>$20.00 USDC sent to Alice</small>
                  </div>
                </div>

              </div>

              <div className="ai-input">
                <span>Ask ROBANK anything...</span>
                <b>?</b>
              </div>
            </div>
          </div>

        </div>

        <div className="agent-cli-note">
          <span>APP</span>
          <b>+</b>
          <span>CLI</span>
          <em>One agent. Wherever you work.</em>
        </div>

      </section>

            <section id="card" className="section card-section">

        <div className="card-copy">
          <div className="section-kicker">THE ROBANK CARD</div>

          <h2>Your digital wallet.<br /><em>In your pocket.</em></h2>

          <p>
            A clean virtual card for everyday online payments, managed directly
            from your ROBANK account.
          </p>

          <Link href="/dashboard" className="button hero-main-button">
            Preview the card <span>?</span>
          </Link>
        </div>

        <div className="card-stage">
          <div className="card-3d-wrap">

            <div className="card-glow" />

            <div className="virtual-card">
              <div className="card-surface">

                <div className="card-top">
                  <span>ROBANK</span>
                  <span>VIRTUAL</span>
                </div>

                <div className="card-chip">
                  <span />
                  <span />
                </div>

                <div className="card-logo">
                  <img src="/robank-mark.png" alt="ROBANK" />
                </div>

                <div className="card-number">
                  •••• &nbsp; •••• &nbsp; •••• &nbsp; 4821
                </div>

                <div className="card-meta">
                  <div>
                    <small>CARDHOLDER</small>
                    <strong>ROBANK MEMBER</strong>
                  </div>

                  <div>
                    <small>EXPIRES</small>
                    <strong>12/28</strong>
                  </div>

                  <div>
                    <small>TYPE</small>
                    <strong>VIRTUAL</strong>
                  </div>
                </div>

                <div className="card-bottom">
                  <span>ROBANK</span>
                  <span>VISA</span>
                </div>

                <div className="card-shine" />
              </div>
            </div>

            <div className="card-floating-info card-info-balance">
              <small>AVAILABLE</small>
              <strong>$12,840.52</strong>
            </div>

            <div className="card-floating-info card-info-status">
              <span />
              <div>
                <small>CARD STATUS</small>
                <strong>ACTIVE</strong>
              </div>
            </div>

          </div>
        </div>

      </section>

      <section id="security" className="section security-section"><div className="security-orb" /><div className="section-kicker">CONTROL</div><h2>Quietly powerful.<br /><em>Clearly yours.</em></h2><p>ROBANK is designed around user-controlled wallets and transparent actions. The interface stays simple; the underlying rails do the heavy lifting.</p><div className="robank-auth"><span>Sign in or create your account with your email.</span><Link href="/login" className="button">Continue with email <b>→</b></Link></div><div className="security-links"><a href="https://github.com/Robank-dev/robank-complete" target="_blank" rel="noreferrer" aria-label="GitHub"><img src="https://cdn.simpleicons.org/github/FFFFFF" alt="" /><span>GitHub</span></a><a href="mailto:contact@robank.co" aria-label="Contact"><span className="contact-icon">✉</span><span>Contact</span></a><a href="https://x.com/robank_co" target="_blank" rel="noreferrer" aria-label="X"><img src="https://cdn.simpleicons.org/x/FFFFFF" alt="" /><span>X</span></a><a href="https://t.me/robank_tg" target="_blank" rel="noreferrer" aria-label="Telegram"><img src="https://cdn.simpleicons.org/telegram/FFFFFF" alt="" /><span>Telegram</span></a><a href="#" aria-label="Contract"><span className="contract-icon">⌘</span><span>Contract</span></a><a href="#" aria-label="DexScreener"><img src="/dex-screener-logo.png" alt="" /><span>DexScreener</span></a><a href="#" aria-label="Uniswap"><img src="/uniswap_logo.png" alt="" /><span>Uniswap</span></a><a href="#" aria-label="CoinGecko"><img src="/coingecko_logo.png" alt="" /><span>CoinGecko</span></a><a href="/docs" aria-label="Docs"><img src="https://cdn.simpleicons.org/readthedocs/FFFFFF" alt="" /><span>Docs</span></a></div></section>
    </main>
  );
}

















