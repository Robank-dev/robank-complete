'use client';

import Link from 'next/link';
import { useState } from 'react';
import SiteChrome, { useAppHref } from '@/components/SiteChrome';
import { AgentDemo, BankVisual, CardVisual, HoldingsVisual, SignVisual, SurfacesVisual } from '@/components/LandingVisuals';
import TokenPill from '@/components/TokenPill';

const TICKER = ['Robinhood Chain', 'Self-custody', 'USDG', 'Stock Tokens', 'AI agent', 'ROBANK Card', 'Borrow on Morpho', 'CLI + API', 'Cash out to PayPal', '$ROBANK'];

const FLOW = [
  ['01', 'Sign in', 'Email and a six-digit code. Your Robinhood Chain wallet is created for you — no seed phrase, no extension.'],
  ['02', 'Deposit', 'Send any token on Robinhood Chain to your address. It shows up in your balance as soon as it confirms.'],
  ['03', 'Hold & grow', 'Keep USDG, ETH and Robinhood Stock Tokens in one view. Borrow USDG against them on Morpho.'],
  ['04', 'Spend & send', 'Pay with your Visa card or send on Robinhood Chain — every transfer is reviewed and signed by you.'],
];

const FAQ = [
  ['Which network does ROBANK use?', 'Only Robinhood Chain. Your ROBANK wallet, balances, deposits, transfers and borrowing all live on Robinhood Chain — one network, one balance, nothing to bridge or choose.'],
  ['Which tokens can I deposit?', 'Any token on Robinhood Chain: USDG, ETH and Robinhood Stock Tokens show with live values. Do not send tokens from other networks such as Ethereum, Base or Solana — they will not arrive in ROBANK and may be lost.'],
  ['Can ROBANK move or freeze my funds?', 'No. Your wallet is self-custodial. ROBANK, the AI agent and the CLI can read your balance and prepare transactions, but only your signature can move funds.'],
  ['What does it cost?', 'Transactions on Robinhood Chain pay a small network fee in ETH, shown before you sign. Keep a little ETH in your wallet to send tokens.'],
  ['Is the ROBANK Card available?', 'Yes. The ROBANK Card is a virtual Visa card you load from your balance and use online wherever Visa is accepted. A one-time identity check is required.'],
  ['Is ROBANK a bank?', 'No. ROBANK is self-custodial software: your money stays in your own wallet on Robinhood Chain. You can spend it with the ROBANK Card and cash it out to PayPal.'],
];

export default function Home() {
  const { href, signedIn } = useAppHref();

  return (
    <SiteChrome bgAfterHero>
      <section className="lp-hero">
        <div className="lp-hero-bg" aria-hidden="true" />
        <div className="lp-hero-shade" aria-hidden="true" />
        <div className="lp-hero-copy">
          <div className="lp-eyebrow-row lp-rise" style={{ '--d': '0ms' } as React.CSSProperties}>
            <div className="lp-eyebrow"><span className="lp-pulse" />Built on Robinhood Chain</div>
            <TokenPill />
          </div>
          <h1 className="lp-rise" style={{ '--d': '90ms' } as React.CSSProperties}><span className="lp-grad">Your money.</span><br /><span className="lp-outline">Your</span> <span className="lp-grad">agent.</span></h1>
          <p className="lp-lead lp-rise" style={{ '--d': '180ms' } as React.CSSProperties}>A self-custodial money account on Robinhood Chain. Deposit any token on the network, hold stablecoins and stock tokens, borrow against them and spend with a Visa card — with an AI agent that prepares every move and never acts without your signature.</p>
          <div className="lp-actions lp-rise" style={{ '--d': '270ms' } as React.CSSProperties}>
            <Link href={href} className="lp-btn lp-btn-light">{signedIn ? 'Open ROBANK' : 'Open your account'} <span>→</span></Link>
            <a href="/how-it-works" className="lp-btn lp-btn-ghost">How it works</a>
          </div>
          <div className="lp-hero-facts lp-rise" style={{ '--d': '360ms' } as React.CSSProperties}>
            <div><b>1 network</b><span>Robinhood Chain only</span></div>
            <div><b>Any token</b><span>on Robinhood Chain</span></div>
            <div><b>Visa</b><span>card for your balance</span></div>
          </div>
        </div>
        <a href="#product" className="lp-scroll" aria-label="Scroll to product"><i /></a>
      </section>

      <div className="lp-ticker" aria-hidden="true">
        <div className="lp-ticker-track">
          {[0, 1].map((k) => <div key={k}>{TICKER.map((t) => <span key={t}>{t}<b>✦</b></span>)}</div>)}
        </div>
      </div>

      <section id="product" className="lp-section">
        <header className="lp-head" data-reveal>
          <div className="lp-kicker">The product</div>
          <h2>One chain.<br /><em>Everything you need.</em></h2>
          <p>ROBANK is built for Robinhood Chain and nothing else. One wallet, one balance, one place to hold, borrow, send and spend — the same account in the app, the CLI, the API and your AI agent.</p>
        </header>
        <div className="lp-features">
          <Feature n="01" title="Everything you hold, one view" text="USDG, ETH and Robinhood Stock Tokens on Robinhood Chain — read straight from the chain, valued live." href={href} cta="Open your account"><HoldingsVisual /></Feature>
          <Feature n="02" title="Ask, review, sign" text="Tell the agent or the CLI what you want. It checks your balance and prepares the transfer; you see the fee and sign." href="/how-it-works" cta="See how it works"><SignVisual /></Feature>
          <Feature n="03" title="App, CLI, API, Skill" text="The same rules everywhere: every surface can read and prepare, and only your wallet can approve." href="/docs#cli" cta="Explore the CLI"><SurfacesVisual /></Feature>
        </div>
      </section>

      <section id="flow" className="lp-section lp-flow-section">
        <header className="lp-head lp-center" data-reveal>
          <div className="lp-kicker">How it works</div>
          <h2>From sign-in to spend<br /><em>in four steps.</em></h2>
        </header>
        <div className="lp-flow">
          <div className="lp-flow-line" aria-hidden="true"><i /></div>
          {FLOW.map(([n, t, d], i) => (
            <div className="lp-flow-step" key={n} data-reveal style={{ '--i': i } as React.CSSProperties}>
              <span className="lp-flow-dot">{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
        <div className="lp-actions lp-center-row"><a href="/how-it-works" className="lp-btn lp-btn-ghost">The full walkthrough <span>→</span></a></div>
      </section>

      <section id="agent" className="lp-section lp-agent">
        <header className="lp-head lp-center" data-reveal>
          <div className="lp-kicker">ROBANK AI</div>
          <h2>Give ROBANK the intent.<br /><em>Let it handle the work.</em></h2>
          <p>Ask in plain language from the app or the terminal. ROBANK reads your balance on Robinhood Chain, prepares the transfer and hands it to you to review and sign.</p>
        </header>
        <AgentDemo />
      </section>

      <section id="card" className="lp-section lp-card-section">
        <div className="lp-card-copy" data-reveal>
          <div className="lp-kicker">ROBANK Card</div>
          <h2>Spend your balance.<br /><em>Anywhere Visa works.</em></h2>
          <p>A virtual Visa card you load from your ROBANK balance and control from the app. Use it online wherever Visa is accepted.</p>
          <ul className="lp-list">
            <li><span>01</span>Load it from your balance — every dollar on your card is a dollar you loaded.</li>
            <li><span>02</span>See the balance, card details and every transaction in the app.</li>
            <li><span>03</span>A one-time identity check keeps your card and account safe.</li>
          </ul>
          <div className="lp-actions"><Link href="/card" className="lp-btn lp-btn-light">Get your card <span>→</span></Link></div>
        </div>
        <CardVisual />
      </section>

      <section id="cashout" className="lp-section lp-bank-section">
        <BankVisual />
        <div className="lp-card-copy" data-reveal>
          <div className="lp-kicker">ROBANK Cash out</div>
          <h2>Your balance,<br /><em>out to PayPal.</em></h2>
          <p>Turn USDG into money in your PayPal account, straight from the app.</p>
          <ul className="lp-list">
            <li><span>01</span><div><b>Cash out to PayPal</b>Receive USD, EUR, GBP, AUD, CAD, JPY or MXN.</div></li>
            <li><span>02</span><div><b>One identity check</b>Verified once by Didit, then cash out any time.</div></li>
            <li><span>03</span><div><b>Clear fees</b>2% (minimum $1), shown before you pay.</div></li>
          </ul>
        </div>
      </section>

      <section id="security" className="lp-section lp-control">
        <div className="lp-control-rings" aria-hidden="true"><i /><i /><i /></div>
        <header className="lp-head lp-center" data-reveal>
          <div className="lp-kicker">Control</div>
          <h2>Quietly powerful.<br /><em>Clearly yours.</em></h2>
          <p>Your wallet is self-custodial: ROBANK, the agent and the CLI can read and prepare, but only your signature moves funds. Every action shows its fee and result on Robinhood Chain.</p>
        </header>
        <div className="lp-pillars">
          {[
            ['Self-custodial', 'Keys are created inside Privy’s secure environment. ROBANK never sees them and cannot sign.'],
            ['Review before sign', 'Amount, recipient and network fee are shown before anything is submitted.'],
            ['On-chain truth', 'Balances are read from Robinhood Chain, never from a database.'],
          ].map(([t, d], i) => (
            <div className="lp-pillar" key={t} data-reveal style={{ '--i': i } as React.CSSProperties}><span className="lp-pillar-icon" /><h3>{t}</h3><p>{d}</p></div>
          ))}
        </div>
      </section>

      <section id="faq" className="lp-section lp-faq-section">
        <header className="lp-head" data-reveal>
          <div className="lp-kicker">FAQ</div>
          <h2>Questions,<br /><em>answered.</em></h2>
          <p>Still curious? Read the <a href="/docs" className="lp-inline-link">docs</a> or write to <a href="mailto:contact@robank.co" className="lp-inline-link">contact@robank.co</a>.</p>
        </header>
        <Faq />
      </section>

      <section className="lp-section lp-cta">
        <div className="lp-cta-box" data-reveal>
          <div className="lp-cta-glow" aria-hidden="true" />
          <img src="/robank-mark.png" alt="" className="lp-cta-mark" />
          <h2>Open your ROBANK<br /><em>in under a minute.</em></h2>
          <p>Sign in with your email. Your Robinhood Chain wallet is ready instantly.</p>
          <div className="lp-actions lp-center-row">
            <Link href={href} className="lp-btn lp-btn-light">{signedIn ? 'Open ROBANK' : 'Continue with email'} <span>→</span></Link>
            <a href="/docs" className="lp-btn lp-btn-ghost">Read the docs</a>
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <div className="lp-faq">
      {FAQ.map(([q, a], i) => (
        <div className={`lp-faq-item ${open === i ? 'open' : ''}`} key={q} data-reveal style={{ '--i': i % 3 } as React.CSSProperties}>
          <button type="button" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
            <span>{q}</span><i aria-hidden="true" />
          </button>
          <div className="lp-faq-a"><div><p>{a}</p></div></div>
        </div>
      ))}
    </div>
  );
}

function Feature({ n, title, text, href, cta, children }: { n: string; title: string; text: string; href: string; cta: string; children: React.ReactNode }) {
  return (
    <article className="lp-feature" data-reveal data-tilt="6" style={{ '--i': Number(n) - 1 } as React.CSSProperties}>
      <div className="lp-feature-inner" data-tilt-target>
        <div className="lp-feature-visual" aria-hidden="true">{children}</div>
        <div className="lp-feature-body">
          <span className="lp-feature-n">{n}</span>
          <h3>{title}</h3>
          <p>{text}</p>
          <a href={href} className="lp-link">{cta} <span>→</span></a>
        </div>
        <div className="lp-spot" />
      </div>
    </article>
  );
}
