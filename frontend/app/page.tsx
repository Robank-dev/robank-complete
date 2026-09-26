'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';

const features = [
  ['01', 'Everything you hold, one view', 'Stablecoins, gas tokens, xStocks and Robinhood Stock Tokens across eight networks — read straight from the chain.'],
  ['02', 'Ask, review, sign', 'Tell the agent or the CLI what you want. It checks your balance and prepares the transfer; you see the fee and sign.'],
  ['03', 'App, CLI, API, Skill', 'The same rules everywhere: every surface can read and prepare, and only your wallet can approve.'],
];

export default function Home() {
  const [menu, setMenu] = useState(false);
  const { ready, authenticated } = usePrivy();
  const appHref = ready && authenticated ? '/dashboard' : '/login';

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
        <div className={`nav-links ${menu ? "open" : ""}`}><a href="/how-it-works">How it works</a><a href="/docs">Docs</a><a href="/docs#cli">CLI & API</a><a href="https://x.com/robankdev" target="_blank" rel="noreferrer">X</a></div>
        <div className="nav-actions"><Link href={appHref} className="button button-small">App</Link></div>
        <button className="menu-button" onClick={() => setMenu(v => !v)} aria-label={menu ? "Close menu" : "Open menu"}>{menu ? "×" : "☰"}</button>
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
            SELF-CUSTODIAL MONEY · WITH AN AI AGENT
          </div>

          <h1 className="hero-title hero-reveal">Your money.<br /><span className="hero-word-wrap"><span className="outline-word">Your</span> agent.</span></h1>

          <p className="hero-lead hero-reveal">Sign in with email and get your own EVM and Solana wallets. Hold stablecoins and tokenized stocks, send across networks, borrow against collateral — with an agent that prepares everything and never moves money without your signature.</p>

          <div className="hero-actions hero-reveal">
            <Link href={appHref} className="button hero-main-button">
              {ready && authenticated ? 'Open ROBANK' : 'Enter ROBANK'} <span>→</span>
            </Link>
          </div>
        </div>

        <div className="hero-visual hero-3d" aria-hidden="true">
          <div className="hero-device">

            <div className="hero-card-back">
              <div className="floating-card-shine" />
              <div className="floating-card-top">
                <span>ROBANK</span>
                <span>COMING SOON</span>
              </div>
              <div className="floating-card-mark">
                <img src="/robank-mark.png" alt="" />
              </div>
              <div className="floating-card-number">
                •••• &nbsp; •••• &nbsp; •••• &nbsp; 4821
              </div>
              <div className="floating-card-bottom">
                <span>ROBANK CARD</span>
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
                    <div><b>↗</b><span>Send</span></div>
                    <div><b>↓</b><span>Receive</span></div>
                    <div><b>✦</b><span>Agent</span></div>
                  </div>

                  <div className="phone-section-head">
                    <span>YOUR HOLDINGS</span>
                    <small>Live balances</small>
                  </div>

                  <div className="portfolio-row">
                    <div className="asset-icon"><img src="/token-icons/usdg.png" alt="USDG" /></div>
                    <div className="asset-name"><b>USDG</b><span>Global Dollar</span></div>
                    <div className="asset-value"><b>$4,820.00</b><span>Value</span></div>
                  </div>

                  <div className="portfolio-row">
                    <div className="asset-icon"><img src="/token-icons/usdc.svg" alt="USDC" /></div>
                    <div className="asset-name"><b>USDC</b><span>USD Coin</span></div>
                    <div className="asset-value"><b>$3,940.52</b><span>Value</span></div>
                  </div>

                  <div className="portfolio-row">
                    <div className="asset-icon"><img src="/token-icons/eth.svg" alt="ETH" /></div>
                    <div className="asset-name"><b>ETH</b><span>Ethereum</span></div>
                    <div className="asset-value"><b>$2,180.00</b><span>Value</span></div>
                  </div>

                  <div className="phone-bottom-nav">
                    <div className="active"><b>◉</b><span>Home</span></div>
                    <div><b>↗</b><span>Send</span></div>
                    <div><b>✦</b><span>Agent</span></div>
                    <div><b>≡</b><span>More</span></div>
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

            <section className="ticker"><div className="ticker-track"><div className="ticker-set"><span>YOUR ACCOUNT</span><b>•</b><span>YOUR AGENT</span><b>•</b><span>PAYMENTS</span><b>•</b><span>USDC</span><b>•</b><span>SELF-CUSTODY</span><b>•</b><span>8 NETWORKS</span><b>•</b><span>API + CLI</span><b>•</b><span>ROBINHOOD CHAIN</span><b>•</b><span>COMPANY · JOBS</span><b>•</b><span>XSTOCKS</span><b>•</b><span>ROBANK</span><b>•</b></div><div className="ticker-set" aria-hidden="true"><span>YOUR ACCOUNT</span><b>•</b><span>YOUR AGENT</span><b>•</b><span>PAYMENTS</span><b>•</b><span>USDC</span><b>•</b><span>SELF-CUSTODY</span><b>•</b><span>8 NETWORKS</span><b>•</b><span>API + CLI</span><b>•</b><span>ROBINHOOD CHAIN</span><b>•</b><span>COMPANY · JOBS</span><b>•</b><span>XSTOCKS</span><b>•</b><span>ROBANK</span><b>•</b></div></div></section>

      <section id="product" className="section product-section">
        <div className="section-intro"><div className="section-kicker">THE PRODUCT</div><h2>Financial context,<br /><em>ready to act.</em></h2><p>One screen for everything you hold on eight networks, and the same account for the app, the CLI, the API and your AI agent.</p></div>
        <div className="feature-grid">
          {features.map(([n,t,d]) => (
            <article className="feature-card" key={n}>
              <span className="feature-number">{n}</span>
              <div className={`feature-image-wrap feature-visual-${n}`} aria-hidden="true">
                {n === '01' && <div className="workspace-visual">
                  <div className="workspace-glow" />
                  <div className="workspace-panel workspace-back"><div className="workspace-panel-head"><span>ASSETS</span><em>3 ACTIVE</em></div><strong>$8,420.00</strong><div className="workspace-mini-bars"><i/><i/><i/><i/></div></div>
                  <div className="workspace-panel workspace-main"><div className="workspace-top"><span>ROBANK</span><em>ACCOUNT</em></div><small>AVAILABLE BALANCE</small><strong>$12,840.52</strong><div className="workspace-chart"><i/><i/><i/><i/><i/><i/><i/></div><div className="workspace-assets"><span>USDC</span><span>ETH</span><span>USDG</span></div></div>
                  <div className="workspace-panel workspace-side"><span>ACTIVITY</span><b>+ $250 USDC</b><em>Payment prepared</em></div>
                  <div className="workspace-orbit orbit-one" /><div className="workspace-orbit orbit-two" /><div className="workspace-node node-one" /><div className="workspace-node node-two" />
                </div>}
                {n === '02' && <div className="agent-visual-card">
                  <div className="agent-glow" />
                  <div className="terminal-card">
                    <div className="terminal-card-head"><span className="terminal-dots"><i/><i/><i/></span><b>robank</b><em>CLI</em></div>
                    <div className="terminal-card-body">
                      <div className="terminal-line"><span>robank@agent:~$</span> robank send 20 USDC 0x9f…a1 --chain base</div>
                      <div className="terminal-result"><i>✓</i> address valid <b>Base</b></div>
                      <div className="terminal-result"><i>✓</i> asset supported <b>USDC</b></div>
                      <div className="terminal-result"><i>✓</i> transfer <b>prepared · not sent</b></div>
                      <div className="terminal-action"><span>READY FOR REVIEW</span><b>→</b></div>
                    </div>
                  </div>
                  <div className="agent-orbit agent-orbit-one"/><div className="agent-orbit agent-orbit-two"/><div className="agent-node agent-node-one"/><div className="agent-node agent-node-two"/>
                </div>}
                {n === '03' && <div className="surfaces-visual">
                  <div className="surface-core"><img src="/robank-mark.png" alt="" /><small>ROBANK</small></div>
                  <div className="surface-ring ring-one"><div className="surface-node">APP</div></div>
                  <div className="surface-ring ring-two"><div className="surface-node">CLI</div></div>
                  <div className="surface-ring ring-three"><div className="surface-node">API</div></div>
                  <div className="surface-pill skill-pill">SKILL <b>ACTIVE</b></div>
                  <div className="surface-connection connection-one"/><div className="surface-connection connection-two"/><div className="surface-connection connection-three"/>
                </div>}
              </div>
              <h3>{t}</h3><p>{d}</p><a href={n === '01' ? appHref : n === '02' ? '/how-it-works' : '/docs#cli'}>{n === '01' ? 'Explore the workspace' : n === '02' ? 'See how it works' : 'Explore the CLI'} <span>→</span></a>
            </article>
          ))}
        </div>
      </section>      <section id="agent" className="section agent-section">

        <div className="agent-intro">
          <div className="section-kicker">ROBANK AI</div>
          <h2>Give ROBANK the intent.<br /><em>Let it handle the work.</em></h2>
          <p>
            Ask in plain language from the app or the CLI. ROBANK reads your balance, prepares the transfer and hands it to you to review and sign.
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
                  <small>v1.0.0 · read · ask · prepare</small>
                </div>

                <div className="terminal-command">
                  <span className="terminal-prompt">ubuntu@robank:~$</span>
                  <strong>robank ask "send 25 USDC to 0x9f…a1 on base"</strong>
                  <i className="terminal-cursor" />
                </div>

                <div className="terminal-output terminal-output-1">
                  <span className="terminal-arrow">›</span>
                  <span>reading your on-chain balances...</span>
                </div>

                <div className="terminal-output terminal-output-2">
                  <span className="terminal-success">✓</span>
                  <span>balance <b>312.40 USDC on Base</b></span>
                </div>

                <div className="terminal-output terminal-output-3">
                  <span className="terminal-success">✓</span>
                  <span>recipient <b>valid Base address</b></span>
                </div>

                <div className="terminal-output terminal-output-4">
                  <span className="terminal-arrow">›</span>
                  <span>preparing transfer...</span>
                </div>

                <div className="terminal-detail terminal-detail-1">
                  <span>amount</span>
                  <b>25 USDC</b>
                </div>

                <div className="terminal-detail terminal-detail-2">
                  <span>payment</span>
                  <b>USDC · Base</b>
                </div>

                <div className="terminal-detail terminal-detail-3">
                  <span>network</span>
                  <b>Base</b>
                </div>

                <div className="terminal-output terminal-output-5">
                  <span className="terminal-arrow">›</span>
                  <span>signature <b>required</b></span>
                </div>

                <div className="terminal-output terminal-output-6">
                  <span className="terminal-success">✓</span>
                  <span>review link <b>ready</b></span>
                </div>

                <div className="terminal-success-box">
                  <div>
                    <span>✓</span>
                    <strong>READY FOR YOUR SIGNATURE</strong>
                  </div>
                  <small>25 USDC · Base · nothing sent yet</small>
                </div>

                <div className="terminal-next">
                  <span className="terminal-prompt">ubuntu@robank:~$</span>
                  <strong>robank status</strong>
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
                  <div>Send 25 USDC to 0x9f…a1 on Base.</div>
                </div>

                <div className="ai-step ai-thinking-step">
                  <span />
                  <div>Thinking</div>
                  <b><i /><i /><i /></b>
                </div>

                <div className="ai-step ai-response-step">
                  <small>ROBANK AI</small>
                  <strong>I prepared that transfer.</strong>
                  <p>You have 312.40 USDC on Base. Review the fee and sign — I never send anything myself.</p>
                </div>

                <div className="ai-step ai-transaction-step">
                  <div className="ai-tx-head">
                    <span>TRANSFER</span>
                    <b>USDC → 0x9f…a1</b>
                  </div>

                  <div className="ai-tx-amount">25 USDC</div>

                  <div className="ai-tx-row"><span>Recipient</span><b>0x9f…a1</b></div>
                  <div className="ai-tx-row"><span>Payment</span><b>USDC · Base</b></div>
                  <div className="ai-tx-row"><span>Network</span><b>Base</b></div>
                  <button>Review & sign <span>→</span></button>
                </div>

                <div className="ai-step ai-success-step">
                  <span>✓</span>
                  <div>
                    <strong>Ready for review</strong>
                    <small>Prepared · not sent</small>
                  </div>
                </div>

              </div>

              <div className="ai-input">
                <span>Ask ROBANK anything...</span>
                <b>↑</b>
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

          <h2>One account.<br /><em>A card is coming.</em></h2>

          <p>
            A debit card for your stablecoin balance is planned. It is not available yet —
            ROBANK will show its real status and fees before anyone can order one.
          </p>

          <Link href="/card" className="button hero-main-button">
            See card status <span>→</span>
          </Link>
        </div>

        <div className="card-stage">
          <div className="card-3d-wrap">

            <div className="card-glow" />

            <div className="virtual-card">
              <div className="card-surface">

                <div className="card-top">
                  <span>ROBANK</span>
                  <span>FINANCIAL CARD</span>
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
                    <strong>ROBANK ACCOUNT</strong>
                  </div>

                  <div>
                    <small>EXPIRES</small>
                    <strong>—/—</strong>
                  </div>

                  <div>
                    <small>TYPE</small>
                    <strong>DIGITAL</strong>
                  </div>
                </div>

                <div className="card-bottom">
                  <span>ROBANK</span>
                  <span>PRIVATE · DIGITAL</span>
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

      <section id="security" className="section security-section"><div className="security-orb" /><div className="section-kicker">CONTROL</div><h2>Quietly powerful.<br /><em>Clearly yours.</em></h2><p>Your wallets are self-custodial: ROBANK, the agent and the CLI can read and prepare, but only your signature moves funds. Every action shows its network, fee and result.</p><div className="robank-auth"><span>Sign in or create your account with your email.</span><Link href="/login" className="button">Continue with email <b>→</b></Link></div><div className="security-links"><a href="https://github.com/Robank-dev/robank-complete" target="_blank" rel="noreferrer" aria-label="GitHub"><img src="https://cdn.simpleicons.org/github/FFFFFF" alt="" /><span>GitHub</span></a><a href="mailto:contact@robank.co" aria-label="Contact"><span className="contact-icon">✉</span><span>Contact</span></a><a href="https://x.com/robankdev" target="_blank" rel="noreferrer" aria-label="X"><img src="https://cdn.simpleicons.org/x/FFFFFF" alt="" /><span>X</span></a><a href="https://t.me/robank_tg" target="_blank" rel="noreferrer" aria-label="Telegram"><img src="https://cdn.simpleicons.org/telegram/FFFFFF" alt="" /><span>Telegram</span></a><a href="/docs" aria-label="Docs"><img src="https://cdn.simpleicons.org/readthedocs/FFFFFF" alt="" /><span>Docs</span></a></div></section>
    </main>
  );
}

















