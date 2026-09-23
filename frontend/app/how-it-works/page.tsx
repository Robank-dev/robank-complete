'use client';

import { useEffect, useMemo, useState } from 'react';

type Step = {
  n: string;
  title: string;
  text: string;
  visual: string;
};

const steps: Step[] = [
  {
    n: '01',
    title: 'Enter ROBANK',
    text: 'Start with your email and enter a financial workspace built for you and your agent.',
    visual: 'login',
  },
  {
    n: '02',
    title: 'Get your wallet',
    text: 'Your personal wallet becomes the place where balances, assets, payments and activity come together.',
    visual: 'wallet',
  },
  {
    n: '03',
    title: 'Fund it',
    text: 'Bring assets in by receiving crypto or using a supported fiat on-ramp.',
    visual: 'fund',
  },
  {
    n: '04',
    title: 'See everything',
    text: 'One view for balances, assets, recent activity and the actions your agent can take.',
    visual: 'dashboard',
  },
  {
    n: '05',
    title: 'Spend with your card',
    text: 'Use your ROBANK virtual card for everyday online spending while keeping it connected to your financial stack.',
    visual: 'card',
  },
  {
    n: '06',
    title: 'Pay anyone',
    text: 'Tell ROBANK who to pay, how much, and let the interface turn the request into an action.',
    visual: 'payment',
  },
  {
    n: '07',
    title: 'Receive money',
    text: 'Share a wallet address or payment request and watch incoming funds appear in your workspace.',
    visual: 'receive',
  },
  {
    n: '08',
    title: 'Swap assets',
    text: 'Ask for a swap, review the route and quote, then execute it through connected on-chain liquidity.',
    visual: 'swap',
  },
  {
    n: '09',
    title: 'Bring in your agent',
    text: 'Your financial agent gets the context it needs to understand balances, history and available actions.',
    visual: 'agent',
  },
  {
    n: '10',
    title: 'Set the rules',
    text: 'Give the agent a financial mandate: limits, allowed assets, approved destinations and actions.',
    visual: 'permissions',
  },
  {
    n: '11',
    title: 'Automate the routine',
    text: 'Turn repeated work into rules: subscriptions, treasury thresholds, recurring payments and scheduled moves.',
    visual: 'automation',
  },
  {
    n: '12',
    title: 'Let agents transact',
    text: 'Your agent can interact with services and other agents through programmable payment rails such as x402.',
    visual: 'a2a',
  },
  {
    n: '13',
    title: 'Understand markets and assets',
    text: 'Use the Assets, Markets and News surfaces for discovery and context. Information is kept separate from authoritative wallet state and execution confirmation.',
    visual: 'routing',
  },
  {
    n: '14',
    title: 'Add your company',
    text: 'Create or register an existing company with legal information and verification state. KYC/KYB remains provider-dependent and status-driven.',
    visual: 'agent',
  },
  {
    n: '15',
    title: 'Turn work into a job',
    text: 'Create work with a clear budget and lifecycle, then let a worker or agent claim, work and submit it through explicit states.',
    visual: 'automation',
  },
  {
    n: '16',
    title: 'Access tokenized assets',
    text: 'Discover supported tokenized products through connected providers, check eligibility and review the product before any provider-backed execution.',
    visual: 'rwa',
  },
  {
    n: '17',
    title: 'Run an autonomous treasury',
    text: 'Create a policy for idle capital: reserve liquidity, allocate approved assets and rebalance only within the rules and live execution path.',
    visual: 'treasury',
  },
  {
    n: '18',
    title: 'Run ROBANK anywhere',
    text: 'Use the app, ROBANK Skill, CLI, API or your own agent workflow. The interface changes; the operating model stays the same.',
    visual: 'terminal',
  },
];

function Visual({ kind }: { kind: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setProgress((v) => (v + 1) % 100);
    }, 70);
    return () => window.clearInterval(id);
  }, []);

  const miniBar = (height: string) => (
    <i style={{ height, animationDelay: `${Math.random() * -2}s` }} />
  );

  if (kind === 'login') {
    return (
      <div className="hw-visual">
        <div className="hw-window hw-login">
          <div className="hw-window-head"><b>ROBANK</b><span>ACCOUNT</span></div>
          <div className="hw-window-body">
            <small>WELCOME TO ROBANK</small>
            <h3>Start with your email.</h3>
            <p>Sign in or create your account to continue.</p>
            <div className="hw-input">you@example.com</div>
            <div className="hw-light-button">Continue with email <b>→</b></div>
          </div>
        </div>
      </div>
    );
  }

  if (kind === 'wallet' || kind === 'dashboard') {
    return (
      <div className="hw-visual">
        <div className="hw-wallet">
          <div className="hw-row hw-muted"><span>{kind === 'wallet' ? 'PERSONAL WALLET' : 'OVERVIEW'}</span><span>•••</span></div>
          <div className="hw-label">TOTAL BALANCE</div>
          <div className="hw-balance">$12,840.52</div>
          <div className="hw-green">+8.42%</div>
          <div className="hw-sparkline">
            {['28%','41%','34%','58%','52%','73%','67%','88%'].map((h, i) => <i key={i} style={{height:h}} />)}
          </div>
          <div className="hw-action-grid">
            <span><b>↗</b>Send</span>
            <span><b>↓</b>Receive</span>
            <span><b>↔</b>Swap</span>
            <span><b>＋</b>Buy</span>
          </div>
          <div className="hw-asset"><span><b>USDC</b><small>Stablecoin</small></span><strong>$12,240.20</strong></div>
          <div className="hw-asset"><span><b>ETH</b><small>Ethereum</small></span><strong>$600.32</strong></div>
        </div>
      </div>
    );
  }

  if (kind === 'fund') {
    return (
      <div className="hw-visual">
        <div className="hw-flow-card">
          <div className="hw-row hw-muted"><span>ADD FUNDS</span><span>ROBANK</span></div>
          <div className="hw-flow">
            <div><b>FIAT</b><small>Card / Bank</small></div>
            <span className="hw-flow-arrow">→</span>
            <div><b>USDC</b><small>Your wallet</small></div>
          </div>
          <div className="hw-progress"><i style={{width:`${55 + progress * .45}%`}} /></div>
          <div className="hw-status"><span>Funding route</span><b>READY</b></div>
          <div className="hw-status"><span>Destination</span><b>ROBANK VAULT</b></div>
        </div>
      </div>
    );
  }

  if (kind === 'card') {
    return (
      <div className="hw-visual hw-card-stage">
        <div className="hw-card">
          <div className="hw-card-top"><span>ROBANK</span><span>VIRTUAL</span></div>
          <div className="hw-chip" />
          <div className="hw-card-r"><img src="/robank-mark.png" alt="" /></div>
          <div className="hw-card-number">•••• •••• •••• 4821</div>
          <div className="hw-card-bottom"><span>ROBANK MEMBER</span><span>PRIVATE Â· DIGITAL</span></div>
        </div>
      </div>
    );
  }

  if (kind === 'payment') {
    return (
      <div className="hw-visual">
        <div className="hw-agent-card">
          <div className="hw-row"><b>ROBANK AI</b><span className="hw-online">● Online</span></div>
          <div className="hw-message">Pay <strong>$20 USDC</strong> to Alice.</div>
          <div className="hw-preview">
            <span>Recipient <b>alice.robinhood</b></span>
            <span>Network <b>Robinhood Chain</b></span>
            <span>Amount <b>20 USDC</b></span>
          </div>
          <div className="hw-success">✓ Example result · verified</div>
        </div>
      </div>
    );
  }

  if (kind === 'receive') {
    const qrOn = (r: number, c: number) => {
      const finder = (x: number, y: number) =>
        ((r >= y && r < y + 7 && c >= x && c < x + 7) &&
          (r === y || r === y + 6 || c === x || c === x + 6 ||
            (r >= y + 2 && r <= y + 4 && c >= x + 2 && c <= x + 4)));
      if (finder(0, 0) || finder(14, 0) || finder(0, 14)) return true;
      return ((r * 13 + c * 7 + r * c) % 11) < 4;
    };
    return (
      <div className="hw-visual">
        <div className="hw-receive">
          <div className="hw-row hw-muted"><span>PAYMENT REQUEST</span><span>USDC</span></div>
          <div className="hw-receive-main">
            <div className="hw-qr-wrap">
              <div className="hw-qr">
                {Array.from({length: 441}).map((_, i) => {
                  const r = Math.floor(i / 21); const c = i % 21;
                  return <i key={i} className={qrOn(r, c) ? 'on' : ''} />;
                })}
              </div>
              <span className="hw-scan-label">SCAN TO PAY</span>
            </div>
            <div className="hw-receive-detail">
              <small>RECEIVE ADDRESS</small>
              <strong>0x7A91...F21C</strong>
              <span>Robinhood Chain · USDC</span>
              <div className="hw-receive-amount"><small>REQUESTED</small><b>250.00 USDC</b></div>
            </div>
          </div>
          <div className="hw-address"><span>0x7A91...F21C</span><b>Copy address</b></div>
          <div className="hw-incoming"><span>Payment request ready</span><strong>+250.00 USDC</strong></div>
        </div>
      </div>
    );
  }

  if (kind === 'swap') {
    return (
      <div className="hw-visual">
        <div className="hw-swap">
          <div className="hw-row hw-muted"><span>SWAP</span><span>UNISWAP</span></div>
          <div className="hw-token-box"><span>Pay</span><strong>500 USDC</strong></div>
          <div className="hw-swap-icon">↕</div>
          <div className="hw-token-box"><span>Receive</span><strong>0.137 ETH</strong></div>
          <div className="hw-status"><span>Route</span><b>OPTIMIZED</b></div>
          <div className="hw-light-button">Review swap <b>→</b></div>
        </div>
      </div>
    );
  }

  if (kind === 'agent') {
    return (
      <div className="hw-visual">
        <div className="hw-agent-stack">
          <div className="hw-agent-head"><span className="hw-avatar"><img src="/robank-mark.png" alt="" /></span><div><b>ROBANK AI</b><small>Financial agent</small></div><span className="hw-online">● Online</span></div>
          <div className="hw-command">“What can you do with my wallet?”</div>
          <div className="hw-agent-reply">I can read your balance, payments and transaction history, and act on approved financial instructions.</div>
          <div className="hw-agent-tags"><span>PAYMENTS</span><span>SWAPS</span><span>TREASURY</span><span>ON-CHAIN</span></div>
        </div>
      </div>
    );
  }

  if (kind === 'permissions') {
    return (
      <div className="hw-visual">
        <div className="hw-perms">
          <div className="hw-row"><b>AGENT MANDATE</b><span>ACTIVE</span></div>
          {[
            ['Payments', 'Up to $2,000'],
            ['Approved assets', 'USDC · ETH'],
            ['Destinations', 'Whitelist'],
            ['Auto execute', 'Enabled'],
          ].map(([a,b]) => (
            <div className="hw-perm" key={a}><span>{a}</span><b>{b}</b></div>
          ))}
          <div className="hw-light-button">Save policy <b>→</b></div>
        </div>
      </div>
    );
  }

  if (kind === 'automation') {
    return (
      <div className="hw-visual">
        <div className="hw-automation">
          <div className="hw-row hw-muted"><span>AUTOMATION</span><span>RUNNING</span></div>
          <div className="hw-rule"><small>WHEN</small><b>USDC balance &gt; $10,000</b></div>
          <div className="hw-rule"><small>THEN</small><b>Move excess to Treasury</b></div>
          <div className="hw-rule"><small>EVERY</small><b>30 days</b></div>
          <div className="hw-live-line"><i /> Next evaluation in 00:14:32</div>
        </div>
      </div>
    );
  }

  if (kind === 'a2a') {
    return (
      <div className="hw-visual">
        <div className="hw-a2a">
          <div className="hw-node"><b>ROBANK</b><small>YOUR AGENT</small></div>
          <div className="hw-route"><i /><i /><i /><i /><i /></div>
          <div className="hw-node"><b>API / AGENT</b><small>PAID SERVICE</small></div>
          <div className="hw-a2a-footer"><span>HTTP 402</span><strong>$0.024 USDC</strong><span>SETTLED</span></div>
        </div>
      </div>
    );
  }

  if (kind === 'routing') {
    return (
      <div className="hw-visual">
        <div className="hw-routing">
          <div className="hw-route-center"><img src="/robank-mark.png" alt="" /></div>
          {[
            ['ROBINHOOD CHAIN', 'SUPPORTED'],
            ['BASE MAINNET', 'SUPPORTED'],
            ['PROVIDER RAIL', 'CHECK AVAILABILITY'],
          ].map(([a,b], i) => (
            <div className={`hw-chain c${i+1}`} key={a}><b>{a}</b><small>{b}</small></div>
          ))}
          <div className="hw-route-line l1" />
          <div className="hw-route-line l2" />
          <div className="hw-route-line l3" />
        </div>
      </div>
    );
  }

  if (kind === 'rwa') {
    return (
      <div className="hw-visual">
        <div className="hw-rwa">
          <div className="hw-row hw-muted"><span>TOKENIZED ASSETS</span><span>PROVIDER RAIL</span></div>
          <div className="hw-rwa-main">
            <div><small>AI BASKET</small><strong>GLOBAL TECH</strong><span>ERC-20 basket</span></div>
            <b className="hw-basket">R</b>
          </div>
          <div className="hw-rwa-holdings">
            <span>NVDA <b>30%</b></span>
            <span>AAPL <b>25%</b></span>
            <span>MSFT <b>25%</b></span>
            <span>TSM <b>20%</b></span>
          </div>
          <div className="hw-light-button">Review basket <b>→</b></div>
          <small className="hw-disclaimer">Provider-dependent access &amp; eligibility apply.</small>
        </div>
      </div>
    );
  }

  if (kind === 'treasury') {
    return (
      <div className="hw-visual">
        <div className="hw-treasury">
          <div className="hw-row"><b>AUTONOMOUS TREASURY</b><span>POLICY ACTIVE</span></div>
          <div className="hw-allocation">
            <div><span>USDC RESERVE</span><b>40%</b></div>
            <div><span>TOKENIZED ASSETS</span><b>40%</b></div>
            <div><span>ETH</span><b>20%</b></div>
          </div>
          <div className="hw-treasury-chart">
            {[45,61,52,73,66,82,76,90].map((h, i) => <i key={i} style={{height:`${h}%`}} />)}
          </div>
          <div className="hw-success">✓ Next rebalance within policy</div>
        </div>
      </div>
    );
  }

  return (
    <div className="hw-visual">
      <div className="hw-terminal">
        <div className="hw-terminal-top"><span>● ● ●</span><b>ubuntu@robank</b><small>bash</small></div>
        <div className="hw-terminal-body">
          <p><span>ubuntu@robank:~$</span> robank agent status</p>
          <p className="muted">loading financial context...</p>
          <p className="ok">✓ wallet connected</p>
          <p className="ok">✓ policy loaded</p>
          <p className="ok">✓ tools available: payments swaps treasury</p>
          <p className="muted">waiting for instruction...</p>
          <p className="cursor"><span>ubuntu@robank:~$</span> <i /></p>
        </div>
      </div>
    </div>
  );
}

export default function HowItWorksPage() {
  const [active, setActive] = useState(0);
  const current = useMemo(() => steps[active], [active]);

  return (
    <main className="how-v2">
      <nav className="hw-nav">
        <a href="/" className="hw-brand"><img src="/robank-mark.png" alt="" /><span>ROBANK</span></a>
        <div className="hw-nav-links">
          <a href="https://x.com/robankdev" target="_blank" rel="noreferrer">X</a>
          <a href="/cli">Skill</a>
          <a href="/how-it-works" className="active">How it works</a>
          <a href="/docs">Docs</a>
        </div>
        <a href="/login" className="hw-app">App <span>→</span></a>
      </nav>

      <header className="hw-header">
        <span>HOW ROBANK WORKS</span>
        <h1>From financial context<br /><em>to financial action.</em></h1>
        <p>ROBANK connects account state, assets, payments, agents and programmable workflows into one operating model. The interface stays readable while the execution path remains explicit.</p>
      </header>

      <section className="hw-timeline">
        <div className="hw-progress-line"><i style={{height:`${((active + 1) / steps.length) * 100}%`}} /></div>

        {steps.map((step, index) => (
          <article
            className={`hw-step ${index === active ? 'is-active' : ''}`}
            key={step.n}
            onMouseEnter={() => setActive(index)}
          >
            <div className="hw-copy">
              <button className="hw-step-button" onClick={() => setActive(index)}>
                <span className="hw-step-num">STEP {step.n}</span>
                <h2>{step.title}</h2>
                <p>{step.text}</p>
              </button>
            </div>

            <div className="hw-stage">
              <Visual kind={step.visual} />
            </div>
          </article>
        ))}
      </section>

      <footer className="hw-end">
        <span>ROBANK</span>
        <b>Your agent. Your money. One financial layer.</b>
      </footer>

      <style jsx global>{`
        .how-v2{min-height:100vh;background:#050607;color:#f3f4f5;overflow:hidden}
        .how-v2 *{box-sizing:border-box}
        .hw-nav{height:82px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;padding:0 5vw;gap:28px;position:sticky;top:0;z-index:30;background:rgba(5,6,7,.76);backdrop-filter:blur(18px)}
        .hw-brand{display:flex;align-items:center;gap:11px;color:#fff;text-decoration:none;font-size:13px;font-weight:650;letter-spacing:.12em}
        .hw-brand img{width:34px;height:34px;border-radius:50%}
        .hw-nav-links{margin-left:auto;display:flex;gap:28px}
        .hw-nav-links a{color:#747a83;text-decoration:none;font-size:12px}
        .hw-nav-links a:hover,.hw-nav-links a.active{color:#fff}
        .hw-app{margin-left:12px;background:#f4f5f6;color:#08090a;text-decoration:none;padding:12px 18px;border-radius:999px;font-size:12px;font-weight:650}
        .hw-app span{margin-left:7px}
        .hw-header{max-width:980px;margin:0 auto;padding:125px 24px 110px;text-align:center}
        .hw-header>span{font:10px ui-monospace,SFMono-Regular,Menlo,monospace;color:#737983;letter-spacing:.22em}
        .hw-header h1{font-size:clamp(58px,7.3vw,104px);line-height:.92;letter-spacing:-.065em;font-weight:520;margin:20px 0}
        .hw-header h1 em{font-style:normal;color:#737983}
        .hw-header p{max-width:680px;margin:24px auto 0;color:#80858d;font-size:14px;line-height:1.85}
        .hw-timeline{max-width:1400px;margin:0 auto;padding:0 5vw 130px;position:relative}
        .hw-progress-line{position:absolute;left:calc(41.5% - 24px);top:0;bottom:120px;width:1px;background:rgba(255,255,255,.07)}
        .hw-progress-line i{display:block;width:100%;background:rgba(255,255,255,.52);transition:height .4s ease}
        .hw-step{display:grid;grid-template-columns:41.5% 58.5%;min-height:540px;align-items:center;padding:88px 0;border-top:1px solid rgba(255,255,255,.075);cursor:default}
        .hw-step:first-child{border-top:0}
        .hw-copy{padding-right:100px}
        .hw-step-button{position:relative;padding:0 0 0 54px;margin:0;border:0;background:none;text-align:left;color:inherit;width:100%;cursor:pointer}
        .hw-step-button:before{content:"";position:absolute;left:0;top:7px;width:11px;height:11px;border-radius:50%;border:1px solid rgba(255,255,255,.42);background:#050607;box-shadow:0 0 0 7px #050607;transition:.3s}
        .hw-step.is-active .hw-step-button:before{background:#fff;border-color:#fff;box-shadow:0 0 0 7px #050607,0 0 22px rgba(255,255,255,.22)}
        .hw-step-num{font:10px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.2em;color:#747a83}
        .hw-step h2{font-size:52px;line-height:1;letter-spacing:-.05em;font-weight:500;margin:18px 0 18px}
        .hw-step p{max-width:450px;margin:0;color:#7e848d;font-size:14px;line-height:1.85}
        .hw-stage{padding-left:35px;min-width:0}
        .hw-visual{min-height:430px;width:100%;display:grid;place-items:center;position:relative;overflow:hidden;border:1px solid rgba(255,255,255,.1);border-radius:22px;background:radial-gradient(circle at 72% 25%,rgba(255,255,255,.055),transparent 40%),linear-gradient(145deg,rgba(255,255,255,.036),rgba(255,255,255,.009));transition:transform .45s,border-color .45s,background .45s}
        .hw-step.is-active .hw-visual{transform:translateY(-5px);border-color:rgba(255,255,255,.18);background:radial-gradient(circle at 72% 25%,rgba(255,255,255,.08),transparent 43%),linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.01))}
        .hw-window,.hw-wallet,.hw-flow-card,.hw-agent-card,.hw-receive,.hw-swap,.hw-agent-stack,.hw-perms,.hw-automation,.hw-a2a,.hw-rwa,.hw-treasury,.hw-terminal{width:min(86%,680px);border:1px solid rgba(255,255,255,.1);border-radius:17px;background:#090b0d;box-shadow:0 35px 90px rgba(0,0,0,.42)}
        .hw-window-head,.hw-terminal-top{height:44px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;padding:0 18px;color:#9da2aa;font:10px ui-monospace}
        .hw-window-head span,.hw-terminal-top small{margin-left:auto;color:#5c626b}
        .hw-window-body{padding:48px}
        .hw-window-body small{font:9px ui-monospace;letter-spacing:.18em;color:#737983}
        .hw-window-body h3{margin:12px 0 8px;font-size:32px;letter-spacing:-.04em;font-weight:500}
        .hw-window-body p{margin:0;color:#707680;font-size:12px}
        .hw-input{height:50px;margin-top:26px;border:1px solid rgba(255,255,255,.09);border-radius:10px;display:flex;align-items:center;padding:0 15px;color:#5c626b;font-size:12px}
        .hw-light-button{height:50px;margin-top:10px;border-radius:10px;background:#f1f2f3;color:#090a0b;display:flex;align-items:center;justify-content:space-between;padding:0 16px;font-size:12px;font-weight:600}
        .hw-row{display:flex;align-items:center;justify-content:space-between;font-size:10px}
        .hw-muted{color:#666c75;font:9px ui-monospace;letter-spacing:.14em}
        .hw-wallet{padding:28px}
        .hw-label{margin-top:34px;color:#696f78;font:9px ui-monospace;letter-spacing:.13em}
        .hw-balance{font-size:52px;letter-spacing:-.055em;margin-top:7px}
        .hw-green{margin-top:5px;color:#c5c9cf;font:10px ui-monospace}
        .hw-sparkline{height:88px;display:flex;align-items:end;gap:8px;margin:22px 0}
        .hw-sparkline i{flex:1;border-radius:3px 3px 0 0;background:linear-gradient(to top,rgba(255,255,255,.02),rgba(255,255,255,.36));animation:hwFloat 2.8s ease-in-out infinite}
        .hw-action-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
        .hw-action-grid span{height:58px;border:1px solid rgba(255,255,255,.07);border-radius:10px;display:flex;flex-direction:column;gap:5px;align-items:center;justify-content:center;color:#888e97;font-size:9px}
        .hw-action-grid b{color:#eef0f2;font-size:14px;font-weight:400}
        .hw-asset{display:flex;align-items:center;justify-content:space-between;padding:13px 0;border-bottom:1px solid rgba(255,255,255,.055);font-size:12px}
        .hw-asset span{display:flex;flex-direction:column;gap:3px}.hw-asset small{font-size:9px;color:#636a73}.hw-asset strong{font-size:12px;font-weight:500}
        .hw-flow-card,.hw-agent-card,.hw-receive,.hw-swap,.hw-agent-stack,.hw-perms,.hw-automation,.hw-a2a,.hw-rwa,.hw-treasury{padding:25px}
        .hw-flow{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:16px;margin:50px 0 28px}
        .hw-flow>div{padding:25px 20px;border:1px solid rgba(255,255,255,.08);border-radius:13px;display:flex;flex-direction:column;gap:7px}
        .hw-flow small,.hw-rule small{color:#5f656e;font:9px ui-monospace;letter-spacing:.1em}.hw-flow b{font-size:18px;font-weight:500}.hw-flow small{font-size:9px}.hw-flow-arrow{font-size:24px;color:#888e97}
        .hw-progress{height:4px;background:rgba(255,255,255,.06);border-radius:10px;overflow:hidden}.hw-progress i{height:100%;display:block;background:#d9dce0;transition:width .2s}
        .hw-status{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.055);font-size:10px;color:#6e747d}.hw-status b{color:#c7cbd0;font:9px ui-monospace}
        .hw-card-stage{perspective:1000px}.hw-card{width:min(70%,500px);aspect-ratio:1.59;background:linear-gradient(145deg,#f2f2ef,#777b7f 52%,#111316);color:#090a0b;border-radius:22px;padding:28px;box-shadow:40px 40px 90px rgba(0,0,0,.5);transform:rotateX(12deg) rotateY(-16deg) rotateZ(4deg);position:relative;animation:hwCardFloat 5s ease-in-out infinite}
        .hw-card-top,.hw-card-bottom{display:flex;justify-content:space-between;font:9px ui-monospace;letter-spacing:.14em}.hw-chip{width:42px;height:30px;border-radius:7px;background:linear-gradient(135deg,#c7c9c7,#666967);margin-top:52px}.hw-card-r{position:absolute;right:30px;top:85px;width:60px;height:60px;border-radius:50%;display:grid;place-items:center;background:#111316;color:#f3f4f5;font-size:25px}.hw-card-number{position:absolute;bottom:70px;left:28px;font:17px ui-monospace;letter-spacing:.1em}.hw-card-bottom{position:absolute;left:28px;right:28px;bottom:26px}
        .hw-online{color:#d0d4d9;font:9px ui-monospace}
        .hw-message{margin:28px 0 15px;font-size:20px;letter-spacing:-.025em}.hw-message strong{font-weight:600}
        .hw-preview{display:grid;gap:0;border:1px solid rgba(255,255,255,.07);border-radius:11px;overflow:hidden}.hw-preview span{display:flex;justify-content:space-between;padding:13px 14px;border-bottom:1px solid rgba(255,255,255,.055);color:#666d76;font-size:10px}.hw-preview span:last-child{border-bottom:0}.hw-preview b{color:#c7cbd1;font-weight:450}
        .hw-success{margin-top:15px;color:#d0d4d9;font:10px ui-monospace}
        .hw-receive-main{display:grid;grid-template-columns:230px 1fr;align-items:center;gap:38px;margin:30px 0 24px}.hw-qr-wrap{display:flex;flex-direction:column;align-items:center;gap:11px}.hw-qr{width:188px;height:188px;display:grid;grid-template-columns:repeat(21,1fr);grid-template-rows:repeat(21,1fr);gap:0;padding:10px;background:#f2f3f4;border-radius:5px;box-shadow:0 18px 45px rgba(0,0,0,.28)}.hw-qr i{background:#f2f3f4}.hw-qr i.on{background:#101214}.hw-scan-label{font:8px ui-monospace;letter-spacing:.18em;color:#666c75}.hw-receive-detail{display:flex;flex-direction:column;gap:8px}.hw-receive-detail>small,.hw-receive-amount small{font:8px ui-monospace;letter-spacing:.14em;color:#626871}.hw-receive-detail>strong{font:26px ui-monospace;letter-spacing:-.04em;color:#eef0f2}.hw-receive-detail>span{font-size:11px;color:#747a83}.hw-receive-amount{margin-top:18px;padding:15px 16px;border:1px solid rgba(255,255,255,.08);border-radius:11px;display:flex;flex-direction:column;gap:7px;background:rgba(255,255,255,.018)}.hw-receive-amount b{font-size:22px;font-weight:500;letter-spacing:-.03em}.hw-address{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border:1px solid rgba(255,255,255,.08);border-radius:9px;font:10px ui-monospace;color:#737983}.hw-address b{color:#d1d4d8;font-weight:400}.hw-address span{overflow:hidden;text-overflow:ellipsis}.hw-incoming{display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding:14px 15px;border:1px solid rgba(255,255,255,.06);border-radius:10px;color:#747a83;font-size:10px}.hw-incoming strong{color:#e1e4e7;font:500 12px ui-monospace}
        .hw-token-box{margin-top:15px;border:1px solid rgba(255,255,255,.08);border-radius:11px;padding:17px;display:flex;justify-content:space-between;align-items:center}.hw-token-box span{color:#686e77;font:9px ui-monospace}.hw-token-box strong{font-size:22px;letter-spacing:-.03em}.hw-swap-icon{text-align:center;font-size:23px;color:#858b94;margin:-3px 0}
        .hw-agent-head{display:flex;align-items:center;gap:10px}.hw-avatar{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:#f0f1f2;color:#08090b;font-weight:700}.hw-agent-head div{display:flex;flex-direction:column;gap:3px}.hw-agent-head small{color:#6a7078;font-size:9px}.hw-agent-head .hw-online{margin-left:auto}
        .hw-command,.hw-agent-reply{margin-top:26px;padding:15px 16px;border:1px solid rgba(255,255,255,.08);border-radius:11px;font-size:12px}.hw-agent-reply{margin-top:8px;color:#858b94;line-height:1.7}
        .hw-agent-tags{display:flex;gap:7px;flex-wrap:wrap;margin-top:17px}.hw-agent-tags span{padding:8px 10px;border:1px solid rgba(255,255,255,.07);border-radius:999px;color:#707680;font:9px ui-monospace}
        .hw-perm{display:flex;justify-content:space-between;padding:18px 0;border-bottom:1px solid rgba(255,255,255,.06);font-size:11px}.hw-perm b{color:#d0d4d9;font:9px ui-monospace}
        .hw-rule{padding:17px 0;border-bottom:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;gap:7px}.hw-rule b{font-size:17px;font-weight:500}.hw-live-line{margin-top:18px;color:#7d838c;font:9px ui-monospace}.hw-live-line i{width:6px;height:6px;background:#fff;border-radius:50%;display:inline-block;margin-right:7px;animation:hwPulse 1.1s infinite}
        .hw-a2a{display:grid;grid-template-columns:1fr 1fr;gap:24px;position:relative}.hw-node{padding:25px;border:1px solid rgba(255,255,255,.09);border-radius:12px;display:flex;flex-direction:column;gap:6px}.hw-node small{color:#626871;font:9px ui-monospace}.hw-route{position:absolute;left:25%;right:25%;top:57px;display:flex;align-items:center;gap:8px}.hw-route i{width:5px;height:5px;background:#ddd;border-radius:50%;animation:hwTravel 1.6s linear infinite}.hw-route i:nth-child(2){animation-delay:.3s}.hw-route i:nth-child(3){animation-delay:.6s}.hw-route i:nth-child(4){animation-delay:.9s}.hw-route i:nth-child(5){animation-delay:1.2s}.hw-a2a-footer{grid-column:1/-1;display:flex;justify-content:space-between;margin-top:18px;color:#6e747d;font:9px ui-monospace}.hw-a2a-footer strong{color:#cfd3d8}
        .hw-routing{width:min(85%,620px);height:330px;position:relative}.hw-route-center{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:92px;height:92px;border-radius:50%;display:grid;place-items:center;background:#f2f3f4;color:#08090b;font-size:34px;box-shadow:0 0 70px rgba(255,255,255,.12)}.hw-chain{position:absolute;display:flex;flex-direction:column;gap:4px;padding:13px 15px;border:1px solid rgba(255,255,255,.08);border-radius:11px;background:#090b0d}.hw-chain small{font:8px ui-monospace;color:#626871}.c1{left:4%;top:10%}.c2{right:2%;top:15%}.c3{left:18%;bottom:4%}.hw-route-line{position:absolute;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.34),transparent);transform-origin:left center}.l1{left:17%;top:29%;width:33%;transform:rotate(12deg)}.l2{left:50%;top:51%;width:32%;transform:rotate(-10deg)}.l3{left:27%;top:68%;width:29%;transform:rotate(-20deg)}
        .hw-rwa-main{margin-top:30px;padding:25px;border:1px solid rgba(255,255,255,.08);border-radius:13px;display:flex;justify-content:space-between;align-items:center}.hw-rwa-main div{display:flex;flex-direction:column;gap:7px}.hw-rwa-main small{font:8px ui-monospace;color:#626871}.hw-rwa-main strong{font-size:26px;letter-spacing:-.03em}.hw-rwa-main span{color:#777d86;font-size:10px}.hw-basket{width:65px;height:65px;border-radius:18px;display:grid;place-items:center;background:#f0f1f2;color:#08090b;font-size:25px}.hw-rwa-holdings{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:15px 0}.hw-rwa-holdings span{display:flex;justify-content:space-between;padding:12px 13px;border:1px solid rgba(255,255,255,.07);border-radius:9px;color:#747a83;font-size:10px}.hw-rwa-holdings b{color:#ced2d7;font-weight:500}.hw-disclaimer{display:block;margin-top:12px;color:#545a63;font:8px ui-monospace;line-height:1.5}
        .hw-allocation{display:grid;gap:0;margin-top:28px}.hw-allocation div{display:flex;justify-content:space-between;padding:16px 0;border-bottom:1px solid rgba(255,255,255,.06);font-size:11px}.hw-allocation b{font-weight:500}.hw-treasury-chart{height:85px;display:flex;align-items:end;gap:7px;margin:24px 0 12px}.hw-treasury-chart i{flex:1;background:linear-gradient(to top,rgba(255,255,255,.02),rgba(255,255,255,.38));border-radius:3px 3px 0 0;animation:hwFloat 3s ease-in-out infinite}
        .hw-terminal-body{padding:25px;font:11px/1.8 ui-monospace;color:#afb4bb}.hw-terminal-body p{margin:0 0 7px}.hw-terminal-body p span{color:#858b94}.hw-terminal-body .muted{color:#606771}.hw-terminal-body .ok{color:#d0d4d9}.hw-terminal-body .cursor i{width:6px;height:13px;background:#ddd;display:inline-block;vertical-align:-2px;animation:hwPulse 1s infinite}
        .hw-end{border-top:1px solid rgba(255,255,255,.08);padding:34px 5vw 70px;display:flex;justify-content:space-between;color:#656b74;font:10px ui-monospace;letter-spacing:.08em}.hw-end b{color:#b6bbc2;font-weight:400}
        @keyframes hwFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}@keyframes hwPulse{0%,100%{opacity:.35;transform:scale(.8)}50%{opacity:1;transform:scale(1.1)}}@keyframes hwCardFloat{0%,100%{transform:rotateX(12deg) rotateY(-16deg) rotateZ(4deg) translateY(0)}50%{transform:rotateX(12deg) rotateY(-16deg) rotateZ(4deg) translateY(-8px)}}@keyframes hwTravel{0%{transform:translateX(-8px);opacity:0}25%{opacity:1}75%{opacity:1}100%{transform:translateX(8px);opacity:0}}
        @media(max-width:1000px){.hw-step{grid-template-columns:1fr;gap:35px;min-height:0;padding:70px 0}.hw-copy{padding-right:40px}.hw-stage{padding-left:0}.hw-progress-line{left:24px}.hw-nav-links{display:none}.hw-header{padding-top:95px}.hw-header h1{font-size:60px}}
        @media(max-width:600px){.hw-header h1{font-size:48px}.hw-step h2{font-size:40px}.hw-step-button{padding-left:36px}.hw-visual{min-height:350px}.hw-window-body{padding:30px}.hw-card{width:82%}.hw-flow{grid-template-columns:1fr;gap:10px}.hw-flow-arrow{transform:rotate(90deg);justify-self:center}.hw-a2a{grid-template-columns:1fr}.hw-route{display:none}.hw-a2a-footer{grid-column:1}.hw-rwa-holdings{grid-template-columns:1fr}.hw-receive-main{grid-template-columns:1fr;gap:24px}.hw-qr{width:156px;height:156px}.hw-receive-detail{align-items:center;text-align:center}.hw-receive-amount{width:100%;text-align:left}.hw-end{flex-direction:column;gap:12px}}
      `}</style>
    </main>
  );
}
