'use client';

import Link from 'next/link';
import PublicShell from '@/components/PublicShell';
import { Badge } from '@/components/ui';

type Step = { title: string; text: string; mock: React.ReactNode };

const Row = ({ k, v }: { k: string; v: React.ReactNode }) => <div><span>{k}</span><b>{v}</b></div>;

const steps: Step[] = [
  {
    title: 'Sign in with email',
    text: 'Enter your email and the six-digit code. There is no browser extension to install and no seed phrase to write down.',
    mock: <><span className="ui-kicker">Sign in</span><div className="ui-input" style={{ display: 'flex', alignItems: 'center', color: 'var(--ui-muted)' }}>you@example.com</div><div className="ui-btn primary block">Continue with email</div></>
  },
  {
    title: 'Get two self-custodial wallets',
    text: 'Privy creates one EVM address — used on Ethereum, Base, Arbitrum, Optimism, Polygon, BNB Chain and Robinhood Chain — and one Solana address. Only you can sign with them.',
    mock: <><span className="ui-kicker">Your wallets</span><div className="ui-kv"><Row k="EVM · 7 networks" v={<span className="ui-mono">0x7a91…f21c</span>} /><Row k="Solana" v={<span className="ui-mono">9xQe…Rk2p</span>} /></div><Badge tone="ok">Self-custodial</Badge></>
  },
  {
    title: 'Add funds',
    text: 'Send USDC, USDT, USDG or gas tokens from another wallet or exchange to your address — matching the network on both sides. Card and bank purchases through MoonPay appear once enabled.',
    mock: <><span className="ui-kicker">Receive</span><div className="ui-kv"><Row k="Asset" v="USDC" /><Row k="Network" v="Base" /><Row k="Address" v={<span className="ui-mono">0x7a91…f21c</span>} /></div><div className="ui-alert warn" style={{ fontSize: 12 }}>Send only USDC on Base to this address.</div></>
  },
  {
    title: 'See everything you hold',
    text: 'Overview reads every network directly: stablecoins, gas tokens, xStocks and Robinhood Stock Tokens. If a network does not answer, ROBANK tells you and keeps your last confirmed balance instead of showing zero.',
    mock: <><span className="ui-kicker">Total balance</span><strong style={{ fontSize: 34, letterSpacing: '-.04em' }}>$1,284.50</strong><div className="ui-kv"><Row k="USDC · Base" v="$900.00" /><Row k="ETH · Arbitrum" v="$312.10" /><Row k="AAPLx · Ethereum" v="$72.40" /></div></>
  },
  {
    title: 'Send with a review step',
    text: 'Choose asset, networks, recipient and amount. ROBANK checks your balance and gas, shows the fee and what the recipient gets, then you sign. Stablecoins can move between networks through LI.FI.',
    mock: <><span className="ui-kicker">Review</span><div className="ui-kv"><Row k="You send" v="25 USDC on Base" /><Row k="Recipient gets" v="24.93 USDC on Solana" /><Row k="Fees" v="≈ $0.07" /></div><div className="ui-btn primary block">Confirm & sign</div></>
  },
  {
    title: 'Ask the agent — it prepares, you sign',
    text: 'Ask about your balances or how things work, or say “send 25 USDC to 0x… on Base”. The agent fills in the Send screen for you. It cannot sign and will never claim something was sent when it was not.',
    mock: <><div className="agent-msg user" style={{ justifySelf: 'end' }}><p>send 25 USDC to 0x9f…a1 on base</p></div><div className="agent-msg assistant"><p style={{ margin: 0, fontSize: 13 }}>Prepared for your review. <b>Nothing has been sent.</b></p></div><Badge tone="pending">Prepared · not sent</Badge></>
  },
  {
    title: 'Borrow against collateral',
    text: 'Supply collateral to a Morpho market on Base or Robinhood Chain and borrow USDC or USDG. ROBANK reads your position on-chain, shows your loan-to-value, and keeps a buffer from the liquidation threshold.',
    mock: <><span className="ui-kicker">cbBTC → USDC · Base</span><div className="ui-kv"><Row k="Loan-to-value" v="41.2%" /><Row k="Liquidation at" v="86.0%" /><Row k="Borrow APY" v="4.80%" /></div></>
  },
  {
    title: 'Hold tokenized stocks',
    text: 'Browse xStocks and Robinhood Stock Tokens, see which ones you hold and receive them on the right network. They are issued by third parties and are not shares; ROBANK has no brokerage.',
    mock: <><span className="ui-kicker">Stocks</span><div className="ui-kv"><Row k="NVDAx · xStocks" v="Ethereum, Solana…" /><Row k="TSLA · Robinhood" v="Robinhood Chain" /></div><span className="ui-muted" style={{ fontSize: 12 }}>Reference prices are indicative.</span></>
  },
  {
    title: 'Post or take jobs',
    text: 'Post a task with an optional stablecoin reward. After approving the work you pay the worker, and ROBANK verifies that exact payment on-chain before marking the job paid.',
    mock: <><span className="ui-kicker">Job</span><div className="ui-kv"><Row k="Reward" v="50 USDC · Base" /><Row k="Status" v="Approved" /><Row k="Payout" v="Verified on-chain" /></div></>
  },
  {
    title: 'Use it from your terminal or agent',
    text: 'Create a personal API key and use the ROBANK CLI or API, or give AI agents the ROBANK Skill. Every surface follows the same rules: read and prepare — never sign.',
    mock: <pre className="ui-code" style={{ margin: 0 }}>{`$ robank balance
Total $1,284.50
$ robank send 25 USDC 0x9f…a1 --chain base
Transfer prepared — nothing has been sent.`}</pre>
  }
];

export default function HowItWorks() {
  return (
    <PublicShell>
      <section className="pub-hero">
        <span className="ui-kicker">How it works</span>
        <h1>Simple money, <span style={{ color: 'var(--ui-muted)' }}>under your control.</span></h1>
        <p>ROBANK gives you self-custodial wallets on eight networks, a clear view of everything you hold, and an assistant that does the preparation — while every action that moves money waits for your signature.</p>
        <p className="ui-muted" style={{ marginTop: 10, fontSize: 12 }}>Illustrations below use example values.</p>
      </section>
      <div className="hiw-steps">
        {steps.map((step, i) => (
          <article className="hiw-step" key={step.title}>
            <div className="hiw-copy"><span className="hiw-num">{String(i + 1).padStart(2, '0')}</span><h2>{step.title}</h2><p>{step.text}</p></div>
            <div className="hiw-mock" aria-hidden="true">{step.mock}</div>
          </article>
        ))}
      </div>
      <section className="ui-panel" style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div><h2 style={{ margin: 0 }}>Not available yet</h2><p className="ui-muted" style={{ marginTop: 6 }}>ROBANK Card, bank payouts, Apple Pay / Google Pay and QR payments. The app shows their real status.</p></div>
        <Link href="/login" className="ui-btn primary">Get started</Link>
      </section>
    </PublicShell>
  );
}
