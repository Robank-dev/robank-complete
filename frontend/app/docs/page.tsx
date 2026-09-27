'use client';

import { useEffect, useState } from 'react';
import SiteChrome from '@/components/SiteChrome';
import TokenPill from '@/components/TokenPill';
import { ROBANK_TOKEN } from '@/lib/token';

const TOC: Array<[string, string] | string> = [
  'Using ROBANK', ['start', 'Getting started'], ['network', 'Robinhood Chain'], ['deposit', 'Deposit'], ['send', 'Send & withdraw'], ['portfolio', 'Portfolio'], ['stocks', 'Stock tokens'], ['borrow', 'Borrow'], ['agent', 'AI agent'], ['card', 'ROBANK Card'], ['cashout', 'Cash out'], ['token', '$ROBANK'], ['security', 'Security'], ['faq', 'FAQ'],
  'Developers', ['cli', 'CLI'], ['api', 'HTTP API'], ['reference', 'Network reference'],
];
const IDS = TOC.filter((t): t is [string, string] => typeof t !== 'string').map(([id]) => id);

function Code({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="d-code">
      <button type="button" onClick={() => { navigator.clipboard?.writeText(children); setCopied(true); setTimeout(() => setCopied(false), 1400); }}>{copied ? 'Copied' : 'Copy'}</button>
      <pre>{children}</pre>
    </div>
  );
}

const Note = ({ tone = 'info', title, children }: { tone?: 'info' | 'warn' | 'soon'; title: string; children: React.ReactNode }) => (
  <div className={`d-note ${tone}`}><b>{title}</b><div>{children}</div></div>
);

export default function DocsPage() {
  const [active, setActive] = useState('start');

  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(visible[0].target.id);
    }, { rootMargin: '-90px 0px -65% 0px' });
    IDS.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);

  return (
    <SiteChrome active="docs">
      <section className="lp-page-hero small">
        <div className="lp-page-glow" aria-hidden="true" />
        <div className="lp-eyebrow lp-rise" style={{ '--d': '0ms' } as React.CSSProperties}><span className="lp-pulse" />Documentation</div>
        <h1 className="lp-rise" style={{ '--d': '90ms' } as React.CSSProperties}><span className="lp-grad">ROBANK docs</span></h1>
        <p className="lp-rise" style={{ '--d': '180ms' } as React.CSSProperties}>Everything about using ROBANK on Robinhood Chain — what you can do, what happens when you move money, and how to build on it.</p>
      </section>

      <div className="d-wrap">
        <aside className="d-toc" aria-label="Contents">
          {TOC.map((item) => typeof item === 'string'
            ? <span key={item}>{item}</span>
            : <a key={item[0]} href={`#${item[0]}`} className={active === item[0] ? 'active' : ''}>{item[1]}</a>)}
        </aside>

        <article className="d-body">
          <section id="start">
            <h2>Getting started</h2>
            <ol className="d-steps">
              <li><b>Sign in.</b> Go to <a href="/login">robank.co/login</a>, enter your email and type the six-digit code you receive.</li>
              <li><b>Get your wallet.</b> ROBANK (through Privy) creates or restores your self-custodial wallet on Robinhood Chain.</li>
              <li><b>Deposit.</b> Open <b>Receive</b>, copy your address and send tokens to it on Robinhood Chain.</li>
              <li><b>Use it.</b> Your balance appears on <b>Overview</b> once the deposit confirms. From there you can send, borrow, spend with your card or ask the agent.</li>
            </ol>
            <Note title="One network">ROBANK works on <b>Robinhood Chain only</b>. Deposits, balances, transfers and borrowing all happen there. There is nothing to bridge and no network to choose.</Note>
          </section>

          <section id="network">
            <h2>Robinhood Chain</h2>
            <p>Robinhood Chain is an EVM network. Your ROBANK address looks like any Ethereum address (<code>0x…</code>), but ROBANK only reads and uses its balance on Robinhood Chain.</p>
            <div className="d-grid">
              <div><span>Chain ID</span><b>4663</b></div>
              <div><span>Gas token</span><b>ETH</b></div>
              <div><span>Stablecoin</span><b>USDG</b></div>
              <div><span>Explorer</span><b><a href="https://robinhoodchain.blockscout.com" target="_blank" rel="noreferrer">Blockscout ↗</a></b></div>
            </div>
            <p>Every transaction pays a small network fee in <b>ETH</b>. Keep a little ETH in your wallet so you can send tokens.</p>
          </section>

          <section id="deposit">
            <h2>Deposit</h2>
            <p>You can deposit <b>any token on Robinhood Chain</b>. Open <b>Receive</b> and share your address or QR code, then send from another wallet or from an exchange that supports withdrawals to Robinhood Chain.</p>
            <ul>
              <li><b>USDG</b>, <b>ETH</b> and <b>Robinhood Stock Tokens</b> are recognised and valued automatically.</li>
              <li>Any other token on Robinhood Chain also arrives in your wallet and is visible on the explorer. The app lists the tokens it recognises.</li>
              <li>A deposit appears once it is confirmed on-chain.</li>
            </ul>
            <Note tone="warn" title="Only send on Robinhood Chain">Tokens sent on Ethereum, Base, Arbitrum, Solana or any other network will not arrive in ROBANK and may not be recoverable. When withdrawing from an exchange, select <b>Robinhood Chain</b> as the network.</Note>
          </section>

          <section id="send">
            <h2>Send &amp; withdraw</h2>
            <p>Choose the token, the recipient and the amount. Before you sign, ROBANK checks that you have enough balance and ETH for gas, and shows:</p>
            <ul>
              <li>the exact amount and token,</li>
              <li>the recipient address,</li>
              <li>the network fee in ETH.</li>
            </ul>
            <p>Nothing is submitted until you sign. <b>Withdrawing</b> is the same as sending: send to an address you control on Robinhood Chain — for example your exchange deposit address for Robinhood Chain.</p>
            <Note tone="warn" title="Transfers are final">Blockchain transfers cannot be reversed by anyone, including ROBANK. Double-check the address, and make sure the receiving side supports Robinhood Chain.</Note>
          </section>

          <section id="portfolio">
            <h2>Portfolio</h2>
            <p><b>Overview</b> reads your balance directly from Robinhood Chain: stablecoins, ETH and stock tokens, with a total in US dollars. Balances are never taken from a database.</p>
            <p>If the network does not answer, ROBANK marks it as unavailable and keeps your last confirmed balance instead of showing zero. Tokens without a reliable price are shown as “No price” and are not included in the total.</p>
          </section>

          <section id="stocks">
            <h2>Stock tokens</h2>
            <p>Robinhood Stock Tokens live on Robinhood Chain. ROBANK lists the active ones, shows the ones you hold and values them at indicative reference prices.</p>
            <Note title="Good to know">Stock tokens are issued by third parties and are not shares. ROBANK has no brokerage and does not buy or sell them for you.</Note>
          </section>

          <section id="borrow">
            <h2>Borrow</h2>
            <p>ROBANK connects to <b>Morpho</b> lending markets on Robinhood Chain, where you can borrow <b>USDG</b> against collateral. Each market pairs one collateral token with USDG and has a fixed liquidation threshold (LLTV).</p>
            <ol className="d-steps">
              <li><b>Supply collateral</b> — approve the token (first time only) and supply it to the market.</li>
              <li><b>Borrow</b> — ROBANK lets you borrow up to 95% of your remaining capacity, keeping a buffer below liquidation.</li>
              <li><b>Repay</b> — partially, or in full including accrued interest.</li>
              <li><b>Withdraw</b> — take collateral back while your position stays healthy.</li>
            </ol>
            <Note tone="warn" title="Liquidation risk">Rates are variable. If your loan-to-value reaches the market’s LLTV — for example because the collateral price falls — part of your collateral can be liquidated by the protocol.</Note>
          </section>

          <section id="agent">
            <h2>AI agent</h2>
            <p>The agent answers in your language and can:</p>
            <ul>
              <li>read your live balance (“what is my balance?”),</li>
              <li>prepare a transfer (“send 250 USDG to 0x…”) — a transfer card appears in the chat; press <b>Send</b> and confirm, or <b>Cancel</b>,</li>
              <li>buy or sell Stock Tokens (“buy $20 of NVDA”) with a live quote,</li>
              <li>find and pay AI services from the Agent Market, per call in USDG,</li>
              <li>explain features, fees and tokens, and point you to the right screen.</li>
            </ul>
            <p>It cannot sign or send anything by itself — every transfer, order and payment waits for your Confirm. If details are missing it asks instead of guessing, and it never claims an action happened unless it is confirmed on-chain.</p>
          </section>

          <section id="card">
            <h2>ROBANK Card</h2>
            <p>The ROBANK Card is a <b>virtual Visa card</b> you load from your ROBANK balance and use online wherever Visa is accepted.</p>
            <ul>
              <li><b>Step 1 — verify your identity</b>: a two-minute ID and selfie check by Didit. The same check unlocks Cash out.</li>
              <li><b>Step 2 — apply</b>: your verified details are filled in; add your phone, address and occupation. The card issuer reviews it.</li>
              <li><b>Step 3 — create your card</b> once approved: $5.50 once plus your starting balance, in one payment.</li>
              <li>Load a starting balance — every dollar on the card is a dollar you loaded.</li>
              <li>Top up any time: 4% + $0.50 per load, shown before you pay.</li>
              <li>See the card details, available balance and transactions in the app.</li>
            </ul>
            <Note tone="warn" title="Protect your card details">Never share your card number or security code with anyone who contacts you. ROBANK will never ask for them.</Note>
          </section>

          <section id="cashout">
            <h2>Cash out to PayPal</h2>
            <p>Move money from your ROBANK balance to your <b>PayPal</b> account. Open <b>Cash out</b>, enter the amount, choose the currency and your PayPal email.</p>
            <ul>
              <li><b>Currencies</b> — USD, EUR, GBP, AUD, CAD, JPY and MXN.</li>
              <li><b>Identity check</b> — the same Didit check as the ROBANK Card; verify once for both.</li>
              <li><b>Fee</b> — 2% of the amount, minimum $1, shown before you confirm. You pay in USDG on Robinhood Chain.</li>
              <li><b>Name</b> — use the name on your PayPal account, or PayPal returns the payout.</li>
            </ul>
            <Note tone="info" title="Arrival">Most payouts arrive in minutes. Follow the status in Cash out; if a payout fails or is not claimed, contact support and your USDG is returned.</Note>
          </section>

          <section id="token">
            <h2>$ROBANK</h2>
            <p><b>$ROBANK</b> is the ROBANK community token on Robinhood Chain.</p>
            <div className="d-grid">
              <div><span>Ticker</span><b>$ROBANK</b></div>
              <div><span>Network</span><b>Robinhood Chain (4663)</b></div>
              <div><span>Contract</span><b>{ROBANK_TOKEN.address ? <code>{ROBANK_TOKEN.address}</code> : 'Published here at launch'}</b></div>
            </div>
            <p style={{ marginTop: 12 }}><TokenPill /></p>
            <Note tone="warn" title="Only trust this address">Always copy the contract address from robank.co. Anyone can create a token with the same name. You do not need $ROBANK to use ROBANK, and holding it is not an investment in ROBANK.</Note>
          </section>

          <section id="security">
            <h2>Security</h2>
            <ul>
              <li><b>Self-custodial.</b> Your wallet key is created and used inside Privy’s secure environment. It is never visible to ROBANK, and ROBANK has no way to sign for you.</li>
              <li><b>You sign everything.</b> The app, the agent, the CLI and the API can read and prepare. Only your signature moves funds.</li>
              <li><b>Server-verified sessions.</b> Every protected request is checked against your Privy session or a hashed personal API key. Addresses sent by a browser are never trusted.</li>
              <li><b>Exportable.</b> You can export your wallet through Privy’s secure flow at any time. Never share the exported key.</li>
            </ul>
          </section>

          <section id="faq">
            <h2>FAQ</h2>
            <h3>Can ROBANK freeze or move my funds?</h3><p>No. ROBANK has no signing access to your wallet.</p>
            <h3>I sent tokens on the wrong network.</h3><p>ROBANK only supports Robinhood Chain, so they will not show in the app. Because the address is an EVM address, tokens sent on another EVM network may still be reachable by exporting your wallet into a wallet that supports that network — but this is not guaranteed.</p>
            <h3>My transfer says “unconfirmed”.</h3><p>The transaction was submitted but ROBANK could not see the confirmation in time. Open the explorer link and do not resend until you know the result.</p>
            <h3>Why is a price missing?</h3><p>Some tokens have no reliable reference price. They are shown as “No price” and are not included in your total.</p>
          </section>

          <section id="cli">
            <h2>CLI</h2>
            <p>The ROBANK CLI reads your account and prepares transfers from the terminal. It never signs — a prepared transfer prints a review link you open in ROBANK. Requires Node 20+.</p>
            <Code>{`git clone https://github.com/Robank-dev/robank-complete
npm install -g ./robank-complete/cli
robank login rbk_…        # create a key at robank.co/cli`}</Code>
            <div className="d-table">
              <table>
                <thead><tr><th>Command</th><th>What it does</th></tr></thead>
                <tbody>
                  <tr><td><code>robank login [rbk_…]</code></td><td>Save a personal API key</td></tr>
                  <tr><td><code>robank logout</code></td><td>Remove the saved key</td></tr>
                  <tr><td><code>robank status</code></td><td>Show which features are live</td></tr>
                  <tr><td><code>robank balance [--fresh]</code></td><td>Your balance and holdings</td></tr>
                  <tr><td><code>robank wallet</code></td><td>Your deposit address</td></tr>
                  <tr><td><code>robank stocks [query]</code></td><td>Browse stock tokens</td></tr>
                  <tr><td><code>robank borrow --chain robinhood</code></td><td>Morpho markets on Robinhood Chain</td></tr>
                  <tr><td><code>robank ask &quot;&lt;message&gt;&quot;</code></td><td>Talk to the ROBANK agent</td></tr>
                  <tr><td><code>robank send &lt;amount&gt; &lt;token&gt; &lt;address&gt; --chain robinhood</code></td><td>Prepare a transfer — prints a review link, nothing is sent</td></tr>
                </tbody>
              </table>
            </div>
            <p>Global flags: <code>--json</code> and <code>--api-url &lt;url&gt;</code>. Environment variables: <code>ROBANK_API_KEY</code>, <code>ROBANK_API_URL</code>. The key is stored in <code>~/.robank/config.json</code>.</p>
          </section>

          <section id="api">
            <h2>HTTP API</h2>
            <p>Base URL <code>https://robank.co</code>. Authenticated requests send a Privy access token or a personal key (<code>rbk_…</code>, up to 5 per account):</p>
            <Code>{`curl https://robank.co/api/portfolio \\
  -H "Authorization: Bearer rbk_…"`}</Code>
            <div className="d-table">
              <table>
                <thead><tr><th>Endpoint</th><th>Auth</th><th>Purpose</th></tr></thead>
                <tbody>
                  <tr><td><code>GET /api/status</code></td><td>—</td><td>Feature states: <code>live</code>, <code>needs-configuration</code>, <code>not-available</code></td></tr>
                  <tr><td><code>GET /api/stocks</code></td><td>—</td><td>Stock tokens with contracts and reference prices</td></tr>
                  <tr><td><code>GET /api/borrow</code></td><td>—</td><td>Morpho markets</td></tr>
                  <tr><td><code>GET /api/portfolio[?fresh=1]</code></td><td>Key</td><td>Your holdings and data sources</td></tr>
                  <tr><td><code>POST /api/agent/chat</code></td><td>Key</td><td>Send <code>{'{message, history?}'}</code>, get <code>{'{response, action}'}</code></td></tr>
                </tbody>
              </table>
            </div>
            <Note title="No signing endpoint">No API endpoint signs or broadcasts a transaction. Anything that moves funds is signed by you in the app.</Note>
          </section>

          <section id="reference">
            <h2>Network reference</h2>
            <div className="d-table">
              <table>
                <tbody>
                  <tr><td>Network</td><td>Robinhood Chain</td></tr>
                  <tr><td>Chain ID</td><td><code>4663</code></td></tr>
                  <tr><td>RPC</td><td><code>https://rpc.mainnet.chain.robinhood.com</code></td></tr>
                  <tr><td>Explorer</td><td><a href="https://robinhoodchain.blockscout.com" target="_blank" rel="noreferrer"><code>robinhoodchain.blockscout.com</code></a></td></tr>
                  <tr><td>Gas token</td><td>ETH (18 decimals)</td></tr>
                  <tr><td>USDG</td><td><code>0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168</code> · 6 decimals</td></tr>
                  <tr><td>Morpho</td><td><code>0x9D53d5E3bd5E8d4Cbfa6DB1ca238AEA02E651010</code></td></tr>
                </tbody>
              </table>
            </div>
            <p>Always verify a contract address on the explorer before interacting with it.</p>
          </section>
        </article>
      </div>
    </SiteChrome>
  );
}
