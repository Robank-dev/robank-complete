'use client';

import { useState } from 'react';

const sections = [
  ['Introduction', 'overview'],
  ['How ROBANK works', 'architecture'],
  ['Account & wallet', 'wallet'],
  ['Payments', 'payments'],
  ['Swap', 'swap'],
  ['Funding', 'funding'],
  ['ROBANK Agent', 'agent'],
  ['Autonomy & permissions', 'autonomy'],
  ['Terminal & API', 'developer'],
  ['Networks', 'networks'],
  ['Assets', 'assets'],
  ['Tokenized assets', 'rwa'],
  ['Card', 'card'],
  ['Security', 'security'],
  ['Roadmap', 'roadmap'],
  ['FAQ', 'faq'],
];

const Badge = ({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) => (
  <span className={`docs-badge ${muted ? 'muted' : ''}`}>{children}</span>
);

function Code({ children }: { children: string }) {
  return (
    <pre className="docs-code"><code>{children}</code></pre>
  );
}

function Callout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="docs-callout">
      <div className="docs-callout-title">{title}</div>
      <div>{children}</div>
    </div>
  );
}

export default function DocsPage() {
  const [open, setOpen] = useState(false);

  return (
    <main className="docs-page">
      <style jsx global>{`
        .docs-page{min-height:100vh;background:#050607;color:#eef0f2}
        .docs-page *{box-sizing:border-box}
        .docs-top{height:78px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;padding:0 4vw;position:sticky;top:0;z-index:30;background:rgba(5,6,7,.82);backdrop-filter:blur(18px)}
        .docs-brand{display:flex;align-items:center;gap:11px;text-decoration:none;color:#fff;font-size:13px;font-weight:650;letter-spacing:.12em}
        .docs-brand img{width:34px;height:34px;border-radius:50%}
        .docs-top-links{margin-left:auto;display:flex;gap:28px;align-items:center}
        .docs-top-links a{color:#7c828a;text-decoration:none;font-size:12px}
        .docs-top-links a:hover{color:#fff}
        .docs-app{margin-left:25px;padding:11px 17px;border-radius:999px;background:#f1f2f3;color:#08090a;text-decoration:none;font-size:12px;font-weight:650}
        .docs-layout{display:grid;grid-template-columns:245px minmax(0,1fr);max-width:1450px;margin:0 auto}
        .docs-sidebar{position:sticky;top:78px;height:calc(100vh - 78px);overflow:auto;padding:35px 22px 50px;border-right:1px solid rgba(255,255,255,.07)}
        .docs-side-title{font:9px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.2em;color:#5e646d;margin-bottom:18px}
        .docs-sidebar a{display:block;padding:9px 10px;border-radius:8px;color:#737983;text-decoration:none;font-size:11px;line-height:1.35}
        .docs-sidebar a:hover{color:#fff;background:rgba(255,255,255,.04)}
        .docs-main{min-width:0;padding:0 7vw 120px}
        .docs-hero{max-width:980px;padding:95px 0 85px;border-bottom:1px solid rgba(255,255,255,.08)}
        .docs-eyebrow{font:9px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.22em;color:#6c727b}
        .docs-hero h1{font-size:clamp(52px,6vw,84px);line-height:.93;letter-spacing:-.065em;font-weight:520;margin:20px 0}
        .docs-hero h1 em{font-style:normal;color:#70767f}
        .docs-hero p{max-width:720px;color:#858b94;font-size:15px;line-height:1.85;margin:0}
        .docs-meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:25px}
        .docs-badge{display:inline-flex;align-items:center;gap:5px;padding:7px 10px;border:1px solid rgba(255,255,255,.09);border-radius:999px;color:#b9bec5;background:rgba(255,255,255,.025);font:9px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.06em}
        .docs-badge.muted{color:#6b717a}
        .docs-section{max-width:900px;padding:75px 0;border-bottom:1px solid rgba(255,255,255,.07);scroll-margin-top:105px}
        .docs-section-kicker{font:9px ui-monospace,SFMono-Regular,Menlo,monospace;color:#676d76;letter-spacing:.2em}
        .docs-section h2{font-size:39px;letter-spacing:-.05em;font-weight:500;margin:11px 0 18px}
        .docs-section h3{font-size:22px;letter-spacing:-.03em;font-weight:500;margin:38px 0 10px}
        .docs-section p{color:#858b94;font-size:14px;line-height:1.85;margin:0 0 16px}
        .docs-section ul{padding-left:18px;color:#858b94;line-height:1.9;font-size:14px;margin:12px 0 20px}
        .docs-section li{padding-left:4px;margin-bottom:6px}
        .docs-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px;margin-top:25px}
        .docs-card{padding:21px;border:1px solid rgba(255,255,255,.08);border-radius:13px;background:linear-gradient(145deg,rgba(255,255,255,.035),rgba(255,255,255,.01))}
        .docs-card b{display:block;color:#d9dde2;font-size:13px;margin-bottom:7px}
        .docs-card span{display:block;color:#747a83;font-size:12px;line-height:1.65}
        .docs-flow{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:28px 0}
        .docs-flow div{padding:16px 13px;border:1px solid rgba(255,255,255,.08);border-radius:10px;font-size:10px;color:#767c85;position:relative}
        .docs-flow b{display:block;color:#d1d5da;font-size:12px;margin-top:7px}
        .docs-table{width:100%;border-collapse:collapse;margin-top:22px;font-size:12px}
        .docs-table th,.docs-table td{padding:14px 11px;border-bottom:1px solid rgba(255,255,255,.06);text-align:left}
        .docs-table th{color:#666c75;font:9px ui-monospace;letter-spacing:.12em}
        .docs-table td{color:#858b94}
        .docs-table td strong{color:#d3d7dc;font-weight:500}
        .docs-code{margin:22px 0;padding:19px;border:1px solid rgba(255,255,255,.08);background:#080a0c;border-radius:12px;overflow:auto;color:#cdd1d6;font:11px/1.75 ui-monospace,SFMono-Regular,Menlo,monospace}
        .docs-callout{margin:24px 0;padding:18px 20px;border-left:2px solid rgba(255,255,255,.32);background:rgba(255,255,255,.025);color:#848a93;font-size:12px;line-height:1.75}
        .docs-callout-title{font-size:11px;color:#d1d5da;margin-bottom:5px;font-weight:600;letter-spacing:.04em}
        .docs-step{display:grid;grid-template-columns:55px 1fr;gap:17px;margin:22px 0}
        .docs-step-num{width:38px;height:38px;border:1px solid rgba(255,255,255,.12);border-radius:50%;display:grid;place-items:center;font:9px ui-monospace;color:#aeb3ba}
        .docs-step b{display:block;color:#d3d7dc;font-size:13px;margin-bottom:5px}
        .docs-step span{display:block;color:#7d838c;font-size:12px;line-height:1.65}
        .docs-links{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:25px}
        .docs-links a{padding:15px 16px;border:1px solid rgba(255,255,255,.08);border-radius:10px;color:#aeb3ba;text-decoration:none;font-size:11px}
        .docs-links a:hover{border-color:rgba(255,255,255,.2);color:#fff}
        .docs-footer{padding:45px 0;color:#5d636c;font:9px ui-monospace;letter-spacing:.1em}
        @media(max-width:900px){
          .docs-layout{grid-template-columns:1fr}
          .docs-sidebar{position:fixed;left:18px;right:18px;top:88px;height:auto;max-height:72vh;z-index:25;border:1px solid rgba(255,255,255,.09);border-radius:14px;background:rgba(8,9,11,.96);display:none}
          .docs-sidebar.open{display:block}
          .docs-main{padding:0 6vw 90px}.docs-top-links{display:none}.docs-menu{display:block;margin-left:auto;border:1px solid rgba(255,255,255,.1);background:transparent;color:#fff;padding:9px 11px;border-radius:8px}
          .docs-grid,.docs-links{grid-template-columns:1fr}.docs-flow{grid-template-columns:repeat(2,1fr)}
        }
        @media(min-width:901px){.docs-menu{display:none}}
        @media(max-width:560px){
          .docs-top{padding:0 5vw}.docs-app{padding:10px 14px;margin-left:12px}.docs-hero{padding:75px 0 60px}.docs-section{padding:58px 0}.docs-section h2{font-size:32px}.docs-flow{grid-template-columns:1fr 1fr}
        }
      `}</style>

      <nav className="docs-top">
        <a href="/" className="docs-brand">
          <img src="/robank-mark.png" alt="" />
          <span>ROBANK</span>
        </a>

        <div className="docs-top-links">
          <a href="/#product">Product</a>
          <a href="/how-it-works">How it works</a>
          <a href="/#agent">AI</a>
        </div>

        <a href="/dashboard" className="docs-app">App <span>→</span></a>
        <button className="docs-menu" onClick={() => setOpen(v => !v)}>Menu</button>
      </nav>

      <div className="docs-layout">
        <aside className={`docs-sidebar ${open ? 'open' : ''}`}>
          <div className="docs-side-title">DOCUMENTATION</div>
          {sections.map(([label, id]) => (
            <a href={`#${id}`} key={id} onClick={() => setOpen(false)}>{label}</a>
          ))}
        </aside>

        <div className="docs-main">
          <header className="docs-hero">
            <span className="docs-eyebrow">ROBANK DOCUMENTATION</span>
            <h1>Give your agent a<br /><em>financial identity.</em></h1>
            <p>
              ROBANK gives an agent the financial layer to hold value, move money,
              access payment rails, interact with on-chain markets and operate within
              rules you define. Wallet, permissions, execution and automation live
              in one system.
            </p>
            <div className="docs-meta">
              <Badge>PRODUCT DOCS</Badge>
              <Badge>WEB3</Badge>
              <Badge>AI AGENT</Badge>
              <Badge muted>BUILDING IN PUBLIC</Badge>
            </div>
          </header>

          <section id="overview" className="docs-section">
            <span className="docs-section-kicker">01 / INTRODUCTION</span>
            <h2>What is ROBANK?</h2>
            <p>
              ROBANK is designed to feel like a modern financial account without
              forcing users to think about blockchain infrastructure every time
              they want to do something.
            </p>
            <p>
              Under the hood, the product is an interface and routing layer over
              on-chain infrastructure. The account can hold stablecoins, move value,
              swap assets, access provider-backed financial rails, and give an AI
              agent a controlled way to operate on the user's behalf.
            </p>
            <div className="docs-grid">
              <div className="docs-card"><b>Wallet</b><span>The account where value lives and authorized actions originate.</span></div>
              <div className="docs-card"><b>Permissions</b><span>Rules that define what an agent can do, where, with which assets, and within what limits.</span></div>
              <div className="docs-card"><b>Financial rails</b><span>Payments, swaps, funding, cards, machine payments and external asset venues.</span></div>
              <div className="docs-card"><b>Execution</b><span>The layer that turns intent into an on-chain transaction or provider action.</span></div>
            </div>
            <Callout title="The idea in one sentence">
              <strong>Give your agent the financial infrastructure to act.</strong>
            </Callout>
          </section>

          <section id="architecture" className="docs-section">
            <span className="docs-section-kicker">02 / HOW ROBANK WORKS</span>
            <h2>One account. Multiple rails.</h2>
            <p>
              ROBANK does not need to reinvent every financial primitive. The
              product can sit above existing infrastructure and make the whole
              experience feel like one system.
            </p>
            <div className="docs-flow">
              <div>01<b>Identity</b>Email / Wallet</div>
              <div>02<b>Vault</b>User-controlled wallet</div>
              <div>03<b>Agent</b>Intent + policy</div>
              <div>04<b>Execution</b>On-chain / provider rail</div>
            </div>
            <h3>Typical action flow</h3>
            <div className="docs-step"><div className="docs-step-num">01</div><div><b>You describe the outcome.</b><span>“Pay Alice 20 USDC.” “Swap 500 USDC to ETH.” “Keep 5,000 USDC liquid.”</span></div></div>
            <div className="docs-step"><div className="docs-step-num">02</div><div><b>ROBANK builds the action.</b><span>The agent reads the request, account context and available tools, then prepares a clear transaction or provider action.</span></div></div>
            <div className="docs-step"><div className="docs-step-num">03</div><div><b>Your policy is checked.</b><span>Permissions, spending limits, approved assets and destinations can constrain what the agent is allowed to execute.</span></div></div>
            <div className="docs-step"><div className="docs-step-num">04</div><div><b>The action runs.</b><span>The final transaction or provider request is submitted through the selected rail and the result is shown back in ROBANK.</span></div></div>
          </section>

          <section id="wallet" className="docs-section">
            <span className="docs-section-kicker">03 / ACCOUNT &amp; WALLET</span>
            <h2>Your financial home.</h2>
            <p>
              The wallet is more than an address on a screen. It is the account
              layer that gives the rest of ROBANK somewhere to read balances from
              and somewhere to send authorized actions to.
            </p>
            <h3>Vault model</h3>
            <p>
              The original ROBANK architecture uses a Safe/Gnosis smart-account
              style vault. The application checks whether a user already has a
              vault, creates one when needed, and then loads balances and
              transaction history against that vault.
            </p>
            <Code>{`User
  ↓
Connect wallet / sign in
  ↓
Check for existing vault
  ↓
Create Safe vault if needed
  ↓
Load balance + transactions
  ↓
ROBANK dashboard`}</Code>
            <Callout title="Development note">
              The current production-facing configuration targets Base Mainnet
              for payments and vault operations, with Robinhood Chain Mainnet
              available as the tokenized-asset rail. The live signing model should
              always match the actual environment you have configured.
            </Callout>
          </section>

          <section id="payments" className="docs-section">
            <span className="docs-section-kicker">04 / PAYMENTS</span>
            <h2>Payments without the busy work.</h2>
            <p>
              ROBANK supports the basic actions a user expects from a financial
              account, but exposes them through both a familiar interface and an
              agent-friendly command layer.
            </p>
            <div className="docs-grid">
              <div className="docs-card"><b>Send</b><span>Send supported assets to a wallet address or supported human-readable recipient.</span></div>
              <div className="docs-card"><b>Receive</b><span>Show a wallet address, copy it, or present a QR flow for incoming payments.</span></div>
              <div className="docs-card"><b>History</b><span>Read recent transactions and show what happened without making the user inspect raw chain data.</span></div>
              <div className="docs-card"><b>Routing</b><span>Build an internal routing layer so payment execution can choose an available rail appropriate for the action.</span></div>
            </div>
            <h3>Examples</h3>
            <Code>{`"Keep $10,000 liquid and move the rest into my approved treasury strategy."

"Pay this $7,500 supplier invoice and choose the best available payment rail."

"Distribute payroll to these wallets every Monday."

"Route this $50,000 payment across the cheapest supported network."

"Show me every outgoing payment above $5,000 and require approval."`}</Code>
            <Callout title="Machine payments">
              ROBANK can also sit between agents and paid services. A workflow can
              encounter an HTTP 402 payment requirement, authorize the payment
              through the configured financial layer, and continue the request
              without turning every machine transaction into a manual checkout.
            </Callout>
          </section>

          <section id="swap" className="docs-section">
            <span className="docs-section-kicker">05 / SWAP</span>
            <h2>Move between assets.</h2>
            <p>
              Swaps are meant to feel like a normal financial action: choose what
              you have, choose what you want, review the quote and route, then
              execute.
            </p>
            <div className="docs-grid">
              <div className="docs-card"><b>Quote first</b><span>Show the expected output before the transaction is sent.</span></div>
              <div className="docs-card"><b>Route visibility</b><span>Make the execution path understandable rather than hiding it behind a button.</span></div>
              <div className="docs-card"><b>Agent-ready</b><span>The agent can translate natural language into a structured swap request.</span></div>
              <div className="docs-card"><b>Provider-backed</b><span>The underlying DEX or liquidity integration remains an execution dependency rather than a ROBANK-issued asset.</span></div>
            </div>
            <Code>{`"Swap 100 USDC to WETH"

→ parse intent
→ fetch quote
→ show preview
→ execute approved transaction`}</Code>
          </section>

          <section id="funding" className="docs-section">
            <span className="docs-section-kicker">06 / FUNDING</span>
            <h2>Bring money into the account.</h2>
            <p>
              The product roadmap includes fiat on-ramp support so a user can get
              from a card or bank-funded source into an on-chain balance without
              manually stitching the journey together.
            </p>
            <Callout title="Planned integration">
              MoonPay is listed in the ROBANK build specification for on-ramp
              functionality. Availability, countries, fees and verification
              requirements depend on the provider and the production setup.
            </Callout>
            <Code>{`GET /api/onramp/url
?walletAddress=0x...
&amount=500

→ returns provider on-ramp URL
→ user completes provider flow
→ supported asset arrives at wallet`}</Code>
          </section>

          <section id="agent" className="docs-section">
            <span className="docs-section-kicker">07 / ROBANK AGENT</span>
            <h2>Your financial operator.</h2>
            <p>
              The ROBANK Agent is designed to understand financial intent instead
              of making users learn a menu tree. It can read account context,
              structure actions and, when authorized, hand those actions to the
              execution layer.
            </p>
            <h3>What the agent understands</h3>
            <table className="docs-table">
              <thead><tr><th>Intent</th><th>Example</th><th>Result</th></tr></thead>
              <tbody>
                <tr><td><strong>Balance</strong></td><td>“What do I have?”</td><td>Reads wallet balance</td></tr>
                <tr><td><strong>Transactions</strong></td><td>“Show my last 5 payments.”</td><td>Fetches transaction history</td></tr>
                <tr><td><strong>Payment</strong></td><td>“Pay Alice 20 USDC.”</td><td>Builds a payment</td></tr>
                <tr><td><strong>Swap</strong></td><td>“Swap 100 USDC to WETH.”</td><td>Starts a swap flow</td></tr>
                <tr><td><strong>Funding</strong></td><td>“Deposit from my bank.”</td><td>Starts an on-ramp flow</td></tr>
              </tbody>
            </table>
            <h3>Agent response model</h3>
            <Code>{`{
  "action": "send | balance | transactions | swap | onramp | info",
  "amount": 20,
  "token": "USDC",
  "to": "0x...",
  "message": "Sending 20 USDC to Alice."
}`}</Code>
            <Callout title="Important">
              The agent is an execution interface, not a replacement for user
              control. Financial actions should remain constrained by the actual
              wallet/signing and permission model used by the deployed product.
            </Callout>
          </section>

          <section id="autonomy" className="docs-section">
            <span className="docs-section-kicker">08 / AUTONOMY &amp; PERMISSIONS</span>
            <h2>From assistant to operator.</h2>
            <p>
              The long-term ROBANK model is not “ask the AI every time.” The agent
              can become useful when a user can define a clear mandate and then
              let routine work happen inside that boundary.
            </p>
            <div className="docs-grid">
              <div className="docs-card"><b>Spend limits</b><span>Set a maximum amount the agent can execute automatically.</span></div>
              <div className="docs-card"><b>Approved assets</b><span>Restrict which tokens or products are allowed for automatic actions.</span></div>
              <div className="docs-card"><b>Approved destinations</b><span>Limit payments to known wallets, services or allowlists.</span></div>
              <div className="docs-card"><b>Manual vs automatic</b><span>Decide which actions need a user approval and which can run under an existing mandate.</span></div>
            </div>
            <h3>Example mandate</h3>
            <Code>{`AGENT MANDATE
────────────────────────
Auto execute:      ON
Daily payment cap: $2,000
Allowed assets:    USDC, ETH
Destinations:      Approved list
RWA access:        Approved providers only
Rebalance:         Monthly`}</Code>
            <Callout title="Design principle">
              “Autonomous” should mean the agent can execute within a mandate —
              not that the agent gets unlimited ownership of the user's money.
            </Callout>
          </section>

          <section id="developer" className="docs-section">
            <span className="docs-section-kicker">09 / TERMINAL &amp; API</span>
            <h2>Use ROBANK where you already work.</h2>
            <p>
              The product is meant to exist beyond the website. A developer or
              agent should be able to reach the same financial capabilities from a
              terminal, API or workflow.
            </p>
            <h3>CLI direction</h3>
            <Code>{`roBank send --to alice.robinhood --amount 20 --token USDC

ROBANK CLI v0.1.0
✓ wallet connected
✓ balance: 12,840.52 USDC
✓ recipient: alice.robinhood
✓ network: Robinhood Chain
✓ transaction confirmed`}</Code>
            <h3>Core API surface</h3>
            <table className="docs-table">
              <thead><tr><th>Endpoint</th><th>Purpose</th></tr></thead>
              <tbody>
                <tr><td><strong>POST /api/agent/chat</strong></td><td>Send a message and receive an agent response/action.</td></tr>
                <tr><td><strong>GET /api/vault/:address</strong></td><td>Read the wallet's Base Mainnet USDC balance.</td></tr>
                <tr><td><strong>GET /api/borrow/status/:address</strong></td><td>Read the wallet's Morpho/Base credit positions.</td></tr>
                <tr><td><strong>POST /api/payments/route</strong></td><td>Build payment routing data and fee estimates.</td></tr>
                <tr><td><strong>GET /api/onramp/url</strong></td><td>Create/retrieve an on-ramp entry URL.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="networks" className="docs-section">
            <span className="docs-section-kicker">10 / NETWORKS</span>
            <h2>One financial layer, more than one chain.</h2>
            <p>
              ROBANK is a multi-chain interface. Base Mainnet is the primary
              payment and settlement rail, while Robinhood Chain Mainnet is the
              tokenized-asset rail. Other networks remain outside the current live scope.
            </p>
            <table className="docs-table">
              <thead><tr><th>Network</th><th>Role in the design</th><th>Status</th></tr></thead>
              <tbody>
                <tr><td><strong>Base Mainnet</strong></td><td>Primary payment and settlement rail</td><td><Badge>LIVE</Badge></td></tr>
                <tr><td><strong>Robinhood Chain Mainnet</strong></td><td>Tokenized-asset rail and Stock Token ecosystem</td><td><Badge>LIVE</Badge></td></tr>
                <tr><td><strong>Arbitrum</strong></td><td>Future multi-chain expansion</td><td><Badge muted>PLANNED</Badge></td></tr>
              </tbody>
            </table>
            <Callout title="Do not hard-code production assumptions">
              Contracts, token addresses, RPC endpoints, supported assets and
              network availability should be treated as environment configuration.
            </Callout>
          </section>

          <section id="assets" className="docs-section">
            <span className="docs-section-kicker">11 / ASSETS</span>
            <h2>What can the wallet hold?</h2>
            <p>
              The original product design uses USDC as the primary unit for
              payments, with USDT, USDG and WETH included in the broader asset
              design. Actual supported assets depend on deployment, liquidity and
              provider availability.
            </p>
            <div className="docs-grid">
              <div className="docs-card"><b>USDC</b><span>Primary payment and accounting asset in the current product design.</span></div>
              <div className="docs-card"><b>USDT</b><span>Planned stablecoin support in the broader asset model.</span></div>
              <div className="docs-card"><b>USDG</b><span>Planned on selected network integrations.</span></div>
              <div className="docs-card"><b>WETH</b><span>Used as a crypto asset and swap destination in the current design.</span></div>
            </div>
          </section>

          <section id="rwa" className="docs-section">
            <span className="docs-section-kicker">12 / TOKENIZED ASSETS</span>
            <h2>Make the agent work with real-world assets.</h2>
            <p>
              A future ROBANK capability is to let users discover and interact
              with supported tokenized asset products through connected providers.
              The key idea is that ROBANK acts as the agent and interface layer,
              while issuance, custody and the legal structure remain with the
              appropriate third-party provider or venue.
            </p>
            <h3>Example: an agent-managed public-markets basket</h3>
            <Code>{`"Build me a diversified technology basket with 30% NVDA,
25% AAPL, 25% MSFT and 20% TSM. Keep the allocation within
my approved asset and risk rules."

→ discover a supported asset venue
→ check eligibility / jurisdiction / availability
→ compare composition and pricing
→ preview the full allocation
→ execute through the connected provider
→ hold the resulting supported tokenized asset in the wallet
→ monitor and rebalance when the mandate allows it`}</Code>
            <h3>Autonomous treasury example</h3>
            <Code>{`TREASURY MANDATE
USDC reserve              40%
ETH                       20%
Approved tokenized assets 40%

Keep at least $5,000 liquid.
Do not exceed 20% per asset.
Rebalance monthly.
Require approval for any new provider.`}</Code>
            <Callout title="Provider-dependent">
              Tokenized securities and other real-world assets can carry asset,
              jurisdiction, eligibility, custody, transfer and regulatory
              constraints. ROBANK should not present itself as the issuer of an
              underlying security unless the relevant legal and operational
              structure actually exists.
            </Callout>
            <p>
              The product concept explored with The Index / Blend is an example
              of the kind of external rail ROBANK can potentially integrate for
              tokenized baskets. It should be treated as an integration target,
              not as a claim that every asset is available everywhere.
            </p>
          </section>

          <section id="card" className="docs-section">
            <span className="docs-section-kicker">13 / CARD</span>
            <h2>A card when you need one.</h2>
            <p>
              ROBANK's card concept is a virtual card layer connected to the
              financial account. The user experience stays inside ROBANK while a
              card issuing provider handles the underlying program.
            </p>
            <div className="docs-grid">
              <div className="docs-card"><b>Virtual-first</b><span>Designed around online payments rather than a physical-card-first experience.</span></div>
              <div className="docs-card"><b>White-label UI</b><span>The card can be presented inside the ROBANK product surface.</span></div>
              <div className="docs-card"><b>Provider-backed</b><span>Issuance and card-network infrastructure remain external dependencies.</span></div>
              <div className="docs-card"><b>User verification</b><span>Provider and KYC/KYB requirements can apply depending on the program.</span></div>
            </div>
          </section>

          <section id="security" className="docs-section">
            <span className="docs-section-kicker">14 / SECURITY</span>
            <h2>Control stays visible.</h2>
            <p>
              Financial software becomes easier to trust when it tells you what
              is happening. ROBANK's interface direction is built around clear
              transaction previews, visible destinations and user-controlled
              signing or delegated execution rather than hidden actions.
            </p>
            <div className="docs-grid">
              <div className="docs-card"><b>User-controlled wallet</b><span>The architecture is designed so ROBANK is not simply a hidden custodian of user funds.</span></div>
              <div className="docs-card"><b>Preview before execution</b><span>Show amount, asset, recipient, network and relevant action context.</span></div>
              <div className="docs-card"><b>Scoped permissions</b><span>Autonomy should be constrained by a policy, not by unlimited access.</span></div>
              <div className="docs-card"><b>Environment separation</b><span>Keep testnet configuration and production configuration clearly separated.</span></div>
            </div>
            <Callout title="Important">
              The exact security properties of the live product depend on the
              final wallet, delegated signer, smart-account and provider setup.
              Documentation should be updated whenever that implementation changes.
            </Callout>
          </section>

          <section id="roadmap" className="docs-section">
            <span className="docs-section-kicker">15 / ROADMAP</span>
            <h2>Where ROBANK is going.</h2>
            <div className="docs-grid">
              <div className="docs-card"><b>Foundation</b><span>Email/wallet entry, wallet/vault setup, balance, send, receive and transaction history.</span></div>
              <div className="docs-card"><b>Agent execution</b><span>Natural-language actions, structured tool calls, permissions and delegated execution.</span></div>
              <div className="docs-card"><b>Financial rails</b><span>On-ramp, swap, card/provider integrations and broader payment routing.</span></div>
              <div className="docs-card"><b>Autonomous finance</b><span>Rules, recurring actions, treasury management, agent-to-agent payments and programmable mandates.</span></div>
              <div className="docs-card"><b>Tokenized assets</b><span>Provider-integrated discovery and execution for supported tokenized real-world asset products.</span></div>
              <div className="docs-card"><b>More ways to operate</b><span>Terminal, API, workflows and agent-native integrations so ROBANK works beyond one website.</span></div>
            </div>
          </section>

          <section id="faq" className="docs-section">
            <span className="docs-section-kicker">16 / FAQ</span>
            <h2>Questions we expect people to ask.</h2>
            <h3>Is ROBANK a traditional bank?</h3>
            <p>No. The product is designed as an on-chain financial interface and routing layer, not as a conventional deposit-taking bank.</p>
            <h3>Does ROBANK hold my private key?</h3>
            <p>The original architecture is designed so ROBANK does not directly hold the user's private key. The final production signing/delegation model determines the exact execution flow.</p>
            <h3>Can the agent execute transactions?</h3>
            <p>That is a core direction of the product. The important part is the permission model: automatic execution should operate only within the authorization and policy boundaries configured for the account.</p>
            <h3>Can ROBANK tokenize stocks or other RWAs itself?</h3>
            <p>The intended approach is provider integration rather than ROBANK casually issuing securities itself. ROBANK can provide discovery, agent logic, rules and interface layers while the appropriate asset venue or provider handles the underlying issuance, eligibility, custody and transfer structure.</p>
            <h3>Can developers use ROBANK outside the website?</h3>
            <p>Yes, that is part of the product direction. The design includes a terminal/CLI and API layer so agents and workflows can access the same financial capabilities.</p>
            <h3>What is the main idea?</h3>
            <Callout title="ROBANK">
              <strong>Give your agent a financial identity.</strong>
            </Callout>
          </section>

          <footer className="docs-footer">
            ROBANK / DOCUMENTATION / BUILDING A FINANCIAL LAYER FOR AGENTS
          </footer>
        </div>
      </div>
    </main>
  );
}
