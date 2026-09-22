'use client';

import Link from 'next/link';
import { useState } from 'react';

const features = [
  ['01', 'One place for your money', 'Hold, move and understand your money without jumping between five different apps.'],
  ['02', 'An agent that gets it', 'Tell ROBANK what you need in plain English. Your agent turns the request into an action.'],
  ['03', 'Built for a global life', 'Move digital dollars across borders, keep your wallet close and stay in control.'],
];

export default function Home() {
  const [menu, setMenu] = useState(false);
  return (
    <main className="site-shell">
      <nav className="top-nav">
        <Link href="/" className="brand"><span className="brand-mark"><img src="/robank-mark.png" alt="" /></span><span>ROBANK</span></Link>
        <div className={`nav-links ${menu ? 'open' : ''}`}>
          <a href="#product">Product</a><a href="#agent">AI Agent</a><a href="#card">Card</a><a href="#security">Security</a>
        </div>
        <div className="nav-actions"><Link href="/dashboard" className="nav-login">Sign in</Link><Link href="/dashboard" className="button button-small">Get started <span>↗</span></Link></div>
        <button className="menu-button" onClick={() => setMenu(v => !v)} aria-label="Open menu">☰</button>
      </nav>

      <section className="hero-section">
        <div className="hero-grid" />
        <div className="hero-image" />
        <div className="hero-orbit hero-orbit-one" /><div className="hero-orbit hero-orbit-two" />
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse-dot" /> A new way to move money</div>
          <h1>Money should<br /><span className="outline-word">move</span> with you.</h1>
          <p className="hero-lead">ROBANK brings your wallet, payments and personal financial agent into one calm, intelligent place.</p>
          <div className="hero-actions"><Link href="/dashboard" className="button">Open ROBANK <span>↗</span></Link><a href="#product" className="text-link">See how it works <span>↓</span></a></div>
          <div className="hero-note"><span>●</span> Non-custodial infrastructure · Designed for a borderless world</div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="planet-wrap"><div className="planet"><div className="planet-light" /><div className="planet-grid" /></div><div className="planet-ring ring-1" /><div className="planet-ring ring-2" /></div>
          <div className="float-chip chip-one">USDC <b>+ $2,840</b></div>
          <div className="float-chip chip-two"><span className="tiny-dot" /> AI AGENT <b>READY</b></div>
          <div className="float-chip chip-three">BASE <b>CONNECTED</b></div>
        </div>
      </section>

      <section className="ticker"><div>YOUR MONEY</div><span>•</span><div>YOUR AGENT</div><span>•</span><div>YOUR WORLD</div><span>•</span><div>ROBANK</div><span>•</span><div>YOUR MONEY</div></section>

      <section id="product" className="section product-section">
        <div className="section-intro"><div className="section-kicker">THE PRODUCT</div><h2>Everything you need.<br /><em>Nothing in the way.</em></h2><p>Designed to feel simple on the surface, with powerful infrastructure underneath.</p></div>
        <div className="feature-grid">{features.map(([n,t,d]) => <article className="feature-card" key={n}><span className="feature-number">{n}</span><div className="feature-3d"><i /><i /><i /></div><h3>{t}</h3><p>{d}</p><a href="#agent">Explore <span>↗</span></a></article>)}</div>
      </section>

      <section id="agent" className="section agent-section">
        <div className="agent-panel">
          <div className="agent-copy"><div className="section-kicker">ROBANK AI</div><h2>Just tell it<br /><em>what you need.</em></h2><p>No dashboards to decode. Ask naturally. Your personal agent can understand balances, payments, transfers and the next step.</p><div className="agent-command"><span>you</span> Send $20 to Alice <b>⌁</b></div><div className="agent-response"><span>ROBANK AI</span><strong>Got it. I found Alice and prepared the payment.</strong><small>$20.00 USDC · Base · Ready to review</small></div><Link href="/agent" className="text-link">Meet your agent <span>↗</span></Link></div>
          <div className="agent-visual"><div className="agent-sphere"><div className="sphere-core">R</div><div className="sphere-ring r-a" /><div className="sphere-ring r-b" /><div className="sphere-ring r-c" /><span className="sphere-node n1" /><span className="sphere-node n2" /><span className="sphere-node n3" /></div></div>
        </div>
      </section>

      <section id="card" className="section card-section">
        <div className="card-copy"><div className="section-kicker">THE ROBANK CARD</div><h2>Your digital wallet.<br /><em>In your pocket.</em></h2><p>A clean virtual card experience for everyday online payments, with the ROBANK interface sitting on top.</p><Link href="/dashboard" className="button">Preview the card <span>↗</span></Link></div>
        <div className="card-stage"><div className="virtual-card"><div className="card-top"><span>ROBANK</span><span>VIRTUAL</span></div><div className="card-logo"><img src="/robank-mark.png" alt="" /></div><div className="card-number">•••• &nbsp;•••• &nbsp;•••• &nbsp;4821</div><div className="card-bottom"><span>ROBANK MEMBER</span><span>VISA</span></div></div><div className="card-shadow" /></div>
      </section>

      <section id="security" className="section security-section"><div className="security-orb" /><div className="section-kicker">CONTROL</div><h2>Quietly powerful.<br /><em>Clearly yours.</em></h2><p>ROBANK is designed around user-controlled wallets and transparent actions. The interface stays simple; the underlying rails do the heavy lifting.</p><div className="security-points"><span>01 / Self-controlled wallet</span><span>02 / Clear transaction previews</span><span>03 / Built for global payments</span></div></section>

      <footer className="footer"><div className="brand"><span className="brand-mark"><img src="/robank-mark.png" alt="" /></span><span>ROBANK</span></div><span>Your money without limits.</span><span>© 2026 ROBANK</span></footer>
    </main>
  );
}
