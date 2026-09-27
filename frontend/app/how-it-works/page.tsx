'use client';

import Link from 'next/link';
import SiteChrome, { useAppHref } from '@/components/SiteChrome';
import { useLoop } from '@/components/LandingFx';
import { BankVisual, CardVisual, HoldingsVisual, SignVisual } from '@/components/LandingVisuals';

type Step = { id: string; kicker: string; title: string; text: string; points: string[]; visual: React.ReactNode };

const steps: Step[] = [
  {
    id: 'sign-in', kicker: 'Account', title: 'Sign in with your email',
    text: 'Enter your email and the six-digit code we send you. There is no browser extension to install and no seed phrase to write down.',
    points: ['Works on any device and browser', 'The same account in the app, CLI and API'],
    visual: <SignInVisual />,
  },
  {
    id: 'wallet', kicker: 'Wallet', title: 'Your Robinhood Chain wallet is ready',
    text: 'On first sign-in, Privy creates a self-custodial wallet for you. Its address is your ROBANK account on Robinhood Chain — only you can sign with it.',
    points: ['Keys never leave Privy’s secure environment', 'ROBANK cannot sign, move or freeze funds'],
    visual: <WalletVisual />,
  },
  {
    id: 'deposit', kicker: 'Deposit', title: 'Deposit any token on Robinhood Chain',
    text: 'Open Receive, copy your address or scan the QR code, and send from another wallet or an exchange that supports Robinhood Chain withdrawals.',
    points: ['USDG, ETH and Robinhood Stock Tokens show with live values', 'Tokens sent on any other network will not arrive'],
    visual: <DepositVisual />,
  },
  {
    id: 'hold', kicker: 'Portfolio', title: 'See everything you hold',
    text: 'Your balance is read directly from Robinhood Chain every time — stablecoins, ETH and stock tokens in one view. If the network does not answer, ROBANK tells you instead of showing zero.',
    points: ['Balances come from the chain, not a database', 'Stock tokens are valued at indicative reference prices'],
    visual: <HoldingsVisual />,
  },
  {
    id: 'send', kicker: 'Send & withdraw', title: 'Send with one confirm',
    text: 'Choose the token, the recipient and the amount. ROBANK checks your balance and gas, shows the network fee, and sends only after you press Confirm. To withdraw, send to an address you control on Robinhood Chain.',
    points: ['Fees are paid in ETH on Robinhood Chain', 'Blockchain transfers cannot be reversed — check the address'],
    visual: <SignVisual />,
  },
  {
    id: 'agent', kicker: 'AI agent', title: 'Ask the agent — it prepares, you sign',
    text: 'Ask about your balance, or say “send 250 USDG to 0x…”. The agent prepares the transfer right in the chat — you press Send and confirm. It cannot sign, and never claims something was sent when it was not.',
    points: ['Asks instead of guessing when details are missing', 'Answers in your language'],
    visual: <ChatVisual />,
  },
  {
    id: 'borrow', kicker: 'Borrow', title: 'Borrow USDG against what you hold',
    text: 'Supply collateral to a Morpho market on Robinhood Chain and borrow USDG. ROBANK reads your position on-chain, shows your loan-to-value and keeps a buffer below liquidation.',
    points: ['Rates are variable and set by the market', 'If loan-to-value reaches the limit, collateral can be liquidated'],
    visual: <BorrowVisual />,
  },
  {
    id: 'card', kicker: 'Card', title: 'Spend with the ROBANK Card',
    text: 'Load a virtual Visa card from your balance and use it online wherever Visa is accepted. See the card details, balance and every transaction in the app.',
    points: ['One-time identity check before your first card', 'Every dollar on the card is a dollar you loaded'],
    visual: <CardVisual compact />,
  },
  {
    id: 'cashout', kicker: 'Cash out', title: 'Cash out to PayPal',
    text: 'Turn USDG into money in your PayPal account in USD, EUR, GBP, AUD, CAD, JPY or MXN. Verify your identity once with Didit, enter the amount and confirm.',
    points: ['2% fee (minimum $1), shown before you pay', 'Follow every payout until it arrives'],
    visual: <BankVisual />,
  },
  {
    id: 'cli', kicker: 'Developers', title: 'Use it from your terminal or agent',
    text: 'Create a personal API key and use the ROBANK CLI or HTTP API, or give AI agents the ROBANK Skill. Every surface follows the same rule: read and prepare — never sign.',
    points: ['Personal keys can be revoked any time', 'Up to 5 keys per account'],
    visual: <TerminalVisual />,
  },
];

export default function HowItWorks() {
  const { href, signedIn } = useAppHref();
  return (
    <SiteChrome active="how">
      <section className="lp-page-hero">
        <div className="lp-page-glow" aria-hidden="true" />
        <div className="lp-eyebrow lp-rise" style={{ '--d': '0ms' } as React.CSSProperties}><span className="lp-pulse" />How it works</div>
        <h1 className="lp-rise" style={{ '--d': '90ms' } as React.CSSProperties}><span className="lp-grad">Simple money,</span><br /><em>under your control.</em></h1>
        <p className="lp-rise" style={{ '--d': '180ms' } as React.CSSProperties}>ROBANK gives you a self-custodial wallet on Robinhood Chain, a clear view of everything you hold, and an assistant that does the preparation — while every action that moves money waits for your signature.</p>
        <div className="lp-hiw-chips lp-rise" style={{ '--d': '270ms' } as React.CSSProperties}>
          <span><img src="/chain-icons/robinhood.svg" alt="" />Robinhood Chain only</span>
          <span>Self-custodial</span>
          <span>You sign every transfer</span>
        </div>
      </section>

      <div className="lp-hiw">
        <nav className="lp-hiw-nav" aria-label="Steps">
          {steps.map((s, i) => <a key={s.id} href={`#${s.id}`}><span>{String(i + 1).padStart(2, '0')}</span>{s.kicker}</a>)}
        </nav>
        <div className="lp-hiw-steps">
          {steps.map((s, i) => (
            <article id={s.id} className={`lp-hiw-step ${i % 2 ? 'flip' : ''}`} key={s.id}>
              <div className="lp-hiw-copy" data-reveal>
                <div className="lp-hiw-num"><span>{String(i + 1).padStart(2, '0')}</span><i />{s.kicker}</div>
                <h2>{s.title}</h2>
                <p>{s.text}</p>
                <ul>{s.points.map((p) => <li key={p}>{p}</li>)}</ul>
              </div>
              <div className="lp-hiw-visual" data-reveal style={{ '--i': 1 } as React.CSSProperties} aria-hidden="true">
                <div className="lp-hiw-visual-inner">{s.visual}</div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <section className="lp-section lp-cta">
        <div className="lp-cta-box" data-reveal>
          <div className="lp-cta-glow" aria-hidden="true" />
          <img src="/robank-mark.png" alt="" className="lp-cta-mark" />
          <h2>Ready when you are.</h2>
          <p>Sign in with your email — your Robinhood Chain wallet is created instantly. Illustrations on this page use example values.</p>
          <div className="lp-actions lp-center-row">
            <Link href={href} className="lp-btn lp-btn-light">{signedIn ? 'Open ROBANK' : 'Get started'} <span>→</span></Link>
            <a href="/docs" className="lp-btn lp-btn-ghost">Read the docs</a>
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}

function SignInVisual() {
  const [ref, step] = useLoop<HTMLDivElement>(8, 380, 2200);
  const code = '482913';
  return (
    <div className="v-panel v-signin" ref={ref}>
      <small className="v-label">Sign in</small>
      <div className="v-field">you@example.com</div>
      <small className="v-label">Enter the code we sent you</small>
      <div className="v-code">{code.split('').map((c, i) => <span key={i} className={step > i ? 'on' : ''}>{step > i ? c : ''}</span>)}</div>
      <div className={`v-btn ${step >= 7 ? 'done' : ''}`}>{step >= 7 ? '✓ Signed in' : 'Continue'}</div>
    </div>
  );
}

function WalletVisual() {
  return (
    <div className="v-panel v-wallet">
      <div className="v-wallet-top">
        <div className="v-net"><img src="/chain-icons/robinhood.svg" alt="" />Robinhood Chain</div>
        <span className="v-badge ok">Self-custodial</span>
      </div>
      <small className="v-label">Your address</small>
      <div className="v-addr">0x7a91<span>c3e2…58d0</span>f21c</div>
      <div className="v-wallet-rows">
        <div><span>Chain ID</span><b>4663</b></div>
        <div><span>Gas token</span><b>ETH</b></div>
        <div><span>Signing</span><b>Only you</b></div>
      </div>
      <div className="v-key"><i />Key secured by Privy · never visible to ROBANK</div>
    </div>
  );
}

const QR = Array.from({ length: 21 * 21 }, (_, i) => {
  const x = i % 21, y = Math.floor(i / 21);
  const finder = (fx: number, fy: number) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7;
  if (finder(0, 0) || finder(14, 0) || finder(0, 14)) {
    const lx = x % 14 === x ? x : x - 14, ly = y % 14 === y ? y : y - 14;
    const r = Math.max(Math.abs(lx - 3), Math.abs(ly - 3));
    return r !== 2;
  }
  return ((x * 7 + y * 13 + x * y) % 5) < 2;
});

function DepositVisual() {
  return (
    <div className="v-panel v-deposit">
      <div className="v-deposit-top">
        <div className="v-qr">{QR.map((on, i) => <i key={i} className={on ? 'on' : ''} />)}<span className="v-qr-logo"><img src="/robank-mark.png" alt="" /></span></div>
        <div className="v-deposit-info">
          <small className="v-label">Deposit to</small>
          <div className="v-addr sm">0x7a91…f21c</div>
          <div className="v-net"><img src="/chain-icons/robinhood.svg" alt="" />Robinhood Chain</div>
        </div>
      </div>
      <div className="v-accept">
        <span className="ok"><img src="/token-icons/usdg.png" alt="" />USDG</span>
        <span className="ok"><img src="/token-icons/eth.png" alt="" />ETH</span>
        <span className="ok"><b className="v-stock xs">TSLA</b>Stock Tokens</span>
      </div>
      <div className="v-warn">Send only on <b>Robinhood Chain</b>. Tokens sent on Ethereum, Base, Solana or any other network will not arrive.</div>
    </div>
  );
}

function ChatVisual() {
  const [ref, step] = useLoop<HTMLDivElement>(5, 900, 2600);
  const on = (n: number) => (step >= n ? 'on' : '');
  return (
    <div className="v-panel v-chat" ref={ref}>
      <div className={`a-msg a-user ${on(0)}`}>What’s my balance?</div>
      <div className={`a-msg a-bot ${on(1)}`}><b>$12,840.52 on Robinhood Chain</b>6,420 USDG, TSLA worth $4,240.52 and 0.8 ETH.</div>
      <div className={`a-msg a-user ${on(2)}`}>Send 250 USDG to 0x9f…a1</div>
      <div className={`a-msg a-bot ${on(3)}`}><b>Your transfer is ready.</b>Press Send to confirm.</div>
      <div className={`v-badge pending ${on(4)}`}>Prepared · not sent</div>
    </div>
  );
}

function BorrowVisual() {
  const ltv = 41.2, lltv = 77;
  const arc = (p: number) => {
    const a = Math.PI * (1 - p / 100);
    return `${100 + 80 * Math.cos(a)} ${100 - 80 * Math.sin(a)}`;
  };
  return (
    <div className="v-panel v-borrow">
      <div className="v-wallet-top">
        <div className="v-net"><img src="/chain-icons/robinhood.svg" alt="" />Morpho · Robinhood Chain</div>
        <span className="v-badge ok">Healthy</span>
      </div>
      <svg viewBox="0 0 200 116" className="v-gauge">
        <path d="M20 100 A80 80 0 0 1 180 100" className="track" />
        <path d={`M20 100 A80 80 0 0 1 ${arc(ltv)}`} className="fill" pathLength={1} />
        <circle cx={arc(lltv).split(' ')[0]} cy={arc(lltv).split(' ')[1]} r="4" className="limit" />
      </svg>
      <div className="v-gauge-val"><strong>{ltv}%</strong><span>loan-to-value</span></div>
      <div className="v-wallet-rows">
        <div><span>Borrowed</span><b>2,000 USDG</b></div>
        <div><span>Liquidation at</span><b>{lltv}% LTV</b></div>
        <div><span>Rate</span><b>variable</b></div>
      </div>
    </div>
  );
}

function TerminalVisual() {
  return (
    <div className="lp-window-inner v-term">
      <div className="lp-window-bar"><span className="lp-dots"><i /><i /><i /></span><b>robank — zsh</b><em>CLI</em></div>
      <div className="lp-cli-body">
        <div className="c-line on"><span className="c-prompt">~ $</span><span className="c-cmd">robank balance</span></div>
        <div className="c-line on"><span className="c-ok">✓</span>total<span className="c-val">$12,840.52</span></div>
        <div className="c-line on"><span className="c-prompt">~ $</span><span className="c-cmd">robank send 250 USDG 0x9f…a1 --chain robinhood</span></div>
        <div className="c-box on"><b>✓ Transfer prepared</b><span>Nothing has been sent. Open the review link to confirm.</span></div>
        <div className="c-line on"><span className="c-prompt">~ $</span><i className="c-caret" /></div>
      </div>
    </div>
  );
}
