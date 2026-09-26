'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PublicShell from '@/components/PublicShell';
import { CapabilityBadge } from '@/components/ui';
import type { Capability } from '@/lib/api';
import { ROBANK_SKILL_FILES } from '@/lib/robankSkillData';

const md = (text: string) => <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ h1: () => null, img: () => null }}>{text}</ReactMarkdown>;
const ref = (name: string) => String((ROBANK_SKILL_FILES as Record<string, string>)[`references/${name}`] || '').replace(/^# .*\n/, '');

const TOC: Array<[string, string] | string> = [
  'Using ROBANK', ['start', 'Getting started'], ['status', 'What works today'], ['wallets', 'Wallets & networks'], ['receive', 'Receiving'], ['send', 'Sending'], ['borrow', 'Borrowing'], ['stocks', 'Tokenized stocks'], ['agent', 'AI agent'], ['jobs', 'Jobs'], ['company', 'Companies'], ['topup', 'Top up & card'], ['security', 'Security'], ['faq', 'FAQ'],
  'Developers', ['cli', 'CLI'], ['api', 'HTTP API'], ['contracts', 'Token contracts'], ['x402', 'Agent Market & x402']
];

export default function DocsPage() {
  const [caps, setCaps] = useState<Capability[] | null>(null);
  useEffect(() => { fetch('/api/status').then((r) => r.json()).then((d) => setCaps(d.capabilities)).catch(() => setCaps([])); }, []);

  return (
    <PublicShell>
      <section className="pub-hero"><span className="ui-kicker">Documentation</span><h1>ROBANK docs</h1><p>How ROBANK works today — what is live, what is not, and exactly what happens when you move money.</p></section>
      <div className="docs">
        <nav className="docs-toc" aria-label="Contents">{TOC.map((item) => typeof item === 'string' ? <span key={item}>{item}</span> : <a key={item[0]} href={`#${item[0]}`}>{item[1]}</a>)}</nav>
        <div className="docs-body">
          <section id="start">
            <h2>Getting started</h2>
            <ol>
              <li>Go to <a href="/login">robank.co/login</a> and enter your email. Type the six-digit code you receive.</li>
              <li>ROBANK (through Privy) creates or restores your two wallets: an EVM address and a Solana address.</li>
              <li>Open <b>Receive</b>, pick the asset and network, and deposit from another wallet or exchange.</li>
              <li>Your balance appears on <b>Overview</b> once the deposit is confirmed on-chain.</li>
            </ol>
            <p>ROBANK is self-custodial software, not a bank. Your funds are on public blockchains in wallets only you can sign for. There is no account number, no deposit insurance, and nobody — including ROBANK — can reverse a blockchain transfer.</p>
          </section>

          <section id="status">
            <h2>What works today</h2>
            <p>This list is read live from the server configuration.</p>
            <table><thead><tr><th>Feature</th><th>Status</th><th>Details</th></tr></thead><tbody>
              {(caps || []).map((c) => <tr key={c.id}><td>{c.label}</td><td><CapabilityBadge state={c.state} /></td><td>{c.detail}</td></tr>)}
              {caps === null && <tr><td colSpan={3}>Loading…</td></tr>}
            </tbody></table>
          </section>

          <section id="wallets">
            <h2>Wallets & networks</h2>
            <p>Your <b>EVM address</b> is the same on Ethereum, Base, Arbitrum, Optimism, Polygon, BNB Chain and Robinhood Chain, but each network holds a separate balance. Your <b>Solana address</b> is separate. Both are embedded Privy wallets: keys are created and used inside Privy&apos;s secure environment and are never visible to ROBANK.</p>
            <p>Each network charges fees in its own gas token — ETH (Ethereum, Base, Arbitrum, Optimism, Robinhood Chain), POL (Polygon), BNB (BNB Chain) or SOL (Solana). Keep a little of it to send tokens.</p>
          </section>

          <section id="receive">
            <h2>Receiving</h2>
            <p>Open <b>Receive</b>, choose the asset and the network, and share the address or QR code. The sender must use the same asset <b>and</b> network. Tokens sent on a network ROBANK does not support may not be recoverable in the app.</p>
          </section>

          <section id="send">
            <h2>Sending</h2>
            {md(ref('robank-payments.md').replace(/^## Receiving[\s\S]*?(?=## Sending)/, '').replace(/^## Sending\n/, ''))}
          </section>

          <section id="borrow">
            <h2>Borrowing</h2>
            <p>ROBANK connects to <b>Morpho</b> lending markets on Base (borrow USDC) and Robinhood Chain (borrow USDG). Each market pairs one collateral asset with one loan asset and has a fixed liquidation threshold (LLTV).</p>
            <ol>
              <li><b>Supply collateral</b> — approve the token (first time) and supply it to the Morpho contract.</li>
              <li><b>Borrow</b> — ROBANK lets you borrow up to 95% of your remaining capacity, keeping a buffer below liquidation.</li>
              <li><b>Repay</b> — partial, or full repayment that clears accrued interest exactly.</li>
              <li><b>Withdraw</b> — take collateral back while your position stays healthy.</li>
            </ol>
            <p>Your position, the oracle price and your loan-to-value are read directly from the chain. Rates are variable. If loan-to-value reaches the LLTV — for example because the collateral price falls — part of your collateral can be liquidated by the protocol. Solana lending is not integrated.</p>
          </section>

          <section id="stocks">
            <h2>Tokenized stocks</h2>
            {md(ref('robank-rwa.md'))}
          </section>

          <section id="agent">
            <h2>AI agent</h2>
            <p>The agent answers in your language and can:</p>
            <ul>
              <li>read your live balances (&ldquo;what is my balance?&rdquo;),</li>
              <li>prepare a transfer (&ldquo;send 25 USDC to 0x… on Base&rdquo;) — it opens Send with everything filled in for you to review and sign,</li>
              <li>explain features, fees and instruments, and point you to the right screen.</li>
            </ul>
            <p>It cannot sign, send, borrow, buy or pay. If details are missing (amount, asset, recipient, network), it asks instead of guessing. It refuses requests to reveal secrets or bypass safety, and it never claims an action happened unless it is confirmed on-chain.</p>
          </section>

          <section id="jobs">
            <h2>Jobs</h2>
            <p>Anyone signed in can post a job with an optional stablecoin reward on an EVM network. The flow is: <b>open → in progress</b> (a worker takes it) <b>→ submitted → approved → paid</b>. Rewards are <b>not escrowed</b>: after approving, the poster pays the worker from their wallet and pastes the transaction hash. ROBANK checks on-chain that the payment went from the poster&apos;s wallet to the worker&apos;s wallet for at least the reward amount, and each transaction can only be used once.</p>
          </section>

          <section id="company">
            <h2>Companies</h2>
            <p>Save your legal entity (name, registration number, jurisdiction). Profiles are private to your account. Business verification (KYB) runs through Didit when it is enabled; ROBANK stores only the verification status, not your documents.</p>
          </section>

          <section id="topup">
            <h2>Top up & card</h2>
            <p><b>Crypto deposits</b> work today through Receive. <b>MoonPay</b> card/bank purchases of USDC appear under Top up once enabled; MoonPay shows its fees and handles identity checks, and the USDC is delivered to your own wallet. The <b>ROBANK Card</b>, bank payouts, Apple Pay / Google Pay and QR payments are not available.</p>
          </section>

          <section id="security">
            <h2>Security</h2>
            {md(ref('robank-security.md'))}
          </section>

          <section id="faq">
            <h2>FAQ</h2>
            <h3>Can ROBANK freeze or move my funds?</h3><p>No. ROBANK has no signing access to your wallets.</p>
            <h3>What happens if a network is down?</h3><p>Overview marks it as unavailable and keeps showing your last confirmed balance for it. Nothing is counted as zero just because a read failed.</p>
            <h3>My transfer says “unconfirmed”.</h3><p>The transaction was submitted but ROBANK could not see the confirmation in time. Open the explorer link; do not resend until you know the result.</p>
            <h3>Why is a price missing?</h3><p>Some tokens have no reliable reference price. They are shown as “No price” and are not included in your total.</p>
            <h3>Can I export my wallet?</h3><p>Yes — embedded wallets can be exported through Privy&apos;s secure flow. Never share the exported key with anyone.</p>
          </section>

          <section id="cli"><h2>CLI</h2>{md(ref('robank-commands.md'))}</section>
          <section id="api"><h2>HTTP API</h2>{md(ref('robank-api.md'))}</section>
          <section id="contracts"><h2>Token contracts</h2>{md(ref('robank-networks.md'))}</section>
          <section id="x402"><h2>Agent Market & x402</h2>{md(ref('robank-x402.md'))}</section>
        </div>
      </div>
    </PublicShell>
  );
}
