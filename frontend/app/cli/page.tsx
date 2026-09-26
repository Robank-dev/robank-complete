'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function CliPage() {
  const [copied, setCopied] = useState(false);
  const command = 'npx skills add Robank-dev/robank-skill';
  const copy = async () => {
    await navigator.clipboard?.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <main className="cli-page">
      <style jsx global>{`
        .cli-page{min-height:100vh;background:#050607;color:#eef0f2}
        .cli-page *{box-sizing:border-box}
        .cli-top{height:78px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;padding:0 4vw;position:sticky;top:0;z-index:20;background:rgba(5,6,7,.78);backdrop-filter:blur(18px)}
        .cli-brand{display:flex;align-items:center;gap:11px;text-decoration:none;color:#fff;font-size:13px;font-weight:650;letter-spacing:.12em}
        .cli-brand img{width:34px;height:34px;border-radius:50%}
        .cli-nav{margin-left:auto;display:flex;align-items:center;gap:28px}
        .cli-nav a{color:#81868e;text-decoration:none;font-size:12px}.cli-nav a:hover{color:#fff}
        .cli-app{padding:11px 17px;border-radius:999px;background:#f1f2f3;color:#08090a!important;font-weight:650}
        .cli-main{max-width:1240px;margin:0 auto;padding:95px 5vw 120px}
        .cli-eyebrow{font:9px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.22em;color:#707680}
        .cli-hero h1{font-size:clamp(54px,7vw,94px);line-height:.92;letter-spacing:-.07em;font-weight:520;margin:20px 0 22px;max-width:900px}
        .cli-hero h1 em{font-style:normal;color:#70767f}.cli-hero p{max-width:760px;color:#858b94;font-size:15px;line-height:1.85}
        .cli-terminal{margin-top:48px;border:1px solid rgba(255,255,255,.1);border-radius:15px;background:#080a0c;overflow:hidden;box-shadow:0 30px 100px rgba(0,0,0,.35)}
        .cli-head{height:50px;display:flex;align-items:center;padding:0 18px;border-bottom:1px solid rgba(255,255,255,.07);gap:8px;color:#686e77;font:10px ui-monospace}
        .cli-dots{display:flex;gap:7px;margin-right:7px}.cli-dots i{width:10px;height:10px;border-radius:50%;background:#303338;display:block}
        .cli-copy{margin-left:auto;border:1px solid rgba(255,255,255,.1);background:transparent;color:#8b9199;padding:8px 11px;font:9px ui-monospace;cursor:pointer}.cli-copy:hover{color:#fff;border-color:rgba(255,255,255,.25)}
        .cli-command{padding:35px 32px;font:15px/1.8 ui-monospace,SFMono-Regular,Menlo,monospace;overflow:auto;white-space:nowrap}.cli-command b{color:#fff;margin-right:12px}.cli-command strong{color:#e2e5e8;font-weight:500}
        .cli-foot{display:flex;gap:28px;padding:13px 24px;border-top:1px solid rgba(255,255,255,.07);color:#555b64;font:8px ui-monospace;letter-spacing:.14em}
        .cli-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:14px}.cli-card{border:1px solid rgba(255,255,255,.08);border-radius:13px;padding:25px;background:linear-gradient(145deg,rgba(255,255,255,.035),rgba(255,255,255,.01))}.cli-card small{font:9px ui-monospace;letter-spacing:.18em;color:#5f656e}.cli-card h2{font-size:22px;letter-spacing:-.035em;font-weight:500;margin:12px 0 9px}.cli-card p{color:#777e87;font-size:12px;line-height:1.75;margin:0}
        .cli-section{margin-top:90px;max-width:900px}.cli-kicker{font:9px ui-monospace;letter-spacing:.2em;color:#666c75}.cli-section h2{font-size:40px;letter-spacing:-.05em;font-weight:500;margin:10px 0 18px}.cli-section>p{color:#818790;font-size:14px;line-height:1.85}.cli-code{margin-top:22px;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:#080a0c;padding:20px;color:#cdd1d6;font:11px/1.8 ui-monospace;overflow:auto}
        .cli-note{margin-top:22px;padding:18px 20px;border-left:2px solid rgba(255,255,255,.28);background:rgba(255,255,255,.025);color:#777e87;font-size:12px;line-height:1.75}.cli-note b{color:#d3d7dc}
        .cli-links{display:flex;gap:10px;margin-top:28px;flex-wrap:wrap}.cli-links a{border:1px solid rgba(255,255,255,.1);padding:12px 15px;border-radius:999px;color:#aeb3ba;text-decoration:none;font:10px ui-monospace;letter-spacing:.08em}.cli-links a:hover{color:#fff;border-color:rgba(255,255,255,.22)}
        @media(max-width:800px){.cli-nav a:not(.cli-app){display:none}.cli-main{padding-top:70px}.cli-grid{grid-template-columns:1fr}.cli-command{padding:26px 20px;font-size:12px}.cli-foot{gap:14px;flex-wrap:wrap}}
      `}</style>
      <nav className="cli-top">
        <Link href="/" className="cli-brand"><img src="/robank-mark.png" alt="" /><span>ROBANK</span></Link>
        <div className="cli-nav">
          <Link href="/how-it-works">How it works</Link>
          <Link href="/docs">Docs</Link>
          <a href="https://github.com/Robank-dev/robank-complete" target="_blank" rel="noreferrer">GitHub</a>
          <Link href="/login" className="cli-app">App →</Link>
        </div>
      </nav>

      <div className="cli-main">
        <header className="cli-hero">
          <span className="cli-eyebrow">ROBANK CLI</span>
          <h1>Give your agent<br /><em>a financial interface.</em></h1>
          <p>Install the ROBANK Skill with one command, then give your agent the context to work with accounts, assets, payments, cards, companies, jobs and on-chain workflows. The CLI is the terminal surface for the same ROBANK operating model.</p>
        </header>

        <div className="cli-terminal">
          <div className="cli-head"><div className="cli-dots"><i/><i/><i/></div><span>~ shell</span><span className="cli-shell-label">npx</span><button className="cli-copy" onClick={copy}>{copied ? 'COPIED' : 'COPY'}</button></div>
          <div className="cli-command"><b>$</b><strong>{command}</strong></div>
          <div className="cli-foot"><span>ROBANK SKILL</span><span>NPX</span><span>WINDOWS / LINUX / MACOS</span></div>
        </div>

        <div className="cli-grid">
          <article className="cli-card"><small>01 / CONTEXT</small><h2>Skill included.</h2><p>The CLI ships with the ROBANK operating context. Users do not need to separately install the ROBANK Skill just to use the CLI workflow.</p></article>
          <article className="cli-card"><small>02 / CONTROL</small><h2>Actions stay explicit.</h2><p>The CLI can read account context and prepare supported actions. State-changing execution still follows the configured wallet, API and authorization model.</p></article>
          <article className="cli-card"><small>03 / ONE SURFACE</small><h2>App + terminal.</h2><p>The web app, CLI and API are different interfaces over the same ROBANK operating model instead of separate products.</p></article>
        </div>
        <section className="cli-section">
          <span className="cli-kicker">QUICK START</span>
          <h2>One command. Full context.</h2>
          <p>The ROBANK Skill is installed through the Skills CLI. It gives compatible agents the current ROBANK operating context and reference layer for the workflows supported by the product.</p>
          <pre className="cli-code"><code>{`npx skills add Robank-dev/robank-skill

# then use ROBANK from your agent or terminal
robank --help
robank status
robank wallet
robank agent status`}</code></pre>
          <div className="cli-note"><b>Skill-first workflow.</b> Install the context layer once. The App, CLI and API remain separate surfaces over the same ROBANK operating model.</div>
        </section>

        <section className="cli-section">
          <span className="cli-kicker">COMMAND SURFACE</span>
          <h2>Everything important, one command away.</h2>
          <pre className="cli-code"><code>{`capital     assets       loan         payments
card        agent        company      jobs
wallet      users        autopilot    onramp
x402        rwa          networks     updates

robank --help`}</code></pre>
          <div className="cli-links"><Link href="/docs#developer">DEVELOPER DOCS →</Link><Link href="/how-it-works">HOW IT WORKS →</Link><a href="https://github.com/Robank-dev/robank-complete" target="_blank" rel="noreferrer">VIEW SOURCE →</a></div>
        </section>
      </div>
    </main>
  );
}
