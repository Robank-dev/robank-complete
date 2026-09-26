'use client';

import { useState } from 'react';

const sections = [
  ['Start here', 'overview'],
  ['How ROBANK works', 'architecture'],
  ['Account & wallet', 'wallet'],
  ['Payments', 'payments'],
  ['Transfers', 'transfers'],
  ['Funding', 'funding'],
  ['ROBANK Agent', 'agent'],
  ['Autonomy & permissions', 'autonomy'],
  ['Terminal & API', 'developer'],
  ['Networks', 'networks'],
  ['Assets', 'assets'],
  ['Xstocks', 'xstocks'],
  ['Agent Market & updates', 'markets'],
  ['Company & KYC/KYB', 'company'],
  ['Jobs', 'jobs'],
  ['Tokenized assets', 'rwa'],
  ['Card', 'card'],
  ['Security', 'security'],
  ['Capability status', 'status'],
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

        <a href="/login" className="docs-app">App <span>→</span></a>
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
              ROBANK is an agent-first financial operating layer. The public site explains the system;
              the authenticated app brings together account entry, wallet and asset views, payments,
              cards, company verification, jobs, markets and ROBANK updates. The ROBANK Skill, CLI and API
              extend the same operating model into developer and agent workflows.
            </p>
            <div className="docs-meta">
              <Badge>BASE MAINNET Â· 8453</Badge>
              <Badge>ROBINHOOD CHAIN Â· 4663</Badge>
              <Badge>PRIVY EMAIL LOGIN</Badge>
              <Badge>AGENT-FIRST</Badge>
              <Badge muted>PROVIDER-DEPENDENT WHERE NOTED</Badge>
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
              move supported assets, access provider-backed financial rails, and give an AI
              agent a controlled way to operate on the user's behalf.
            </p>
            <div className="docs-grid">
              <div className="docs-card"><b>Wallet</b><span>The account where value lives and authorized actions originate.</span></div>
              <div className="docs-card"><b>Permissions</b><span>Rules that define what an agent can do, where, with which assets, and within what limits.</span></div>
              <div className="docs-card"><b>Financial rails</b><span>Payments, funding, cards, machine payments and external asset venues.</span></div>
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
              <div>02<b>Wallet</b>User-controlled account wallet</div>
              <div>03<b>Agent</b>Intent + policy</div>
              <div>04<b>Execution</b>On-chain / provider rail</div>
            </div>
            <h3>Typical action flow</h3>
            <div className="docs-step"><div className="docs-step-num">01</div><div><b>You describe the outcome.</b><span>“Pay Alice 20 USDC.” “Move 500 USDC to another supported network.” “Keep 5,000 USDC liquid.”</span></div></div>
            <div className="docs-step"><div className="docs-step-num">02</div><div><b>ROBANK builds the action.</b><span>The agent reads the request, account context and available tools, then prepares a clear transaction or provider action.</span></div></div>
            <div className="docs-step"><div className="docs-step-num">03</div><div><b>Your policy is checked.</b><span>Permissions, spending limits, approved assets and destinations can constrain what the agent is allowed to execute.</span></div></div>
            <div className="docs-step"><div className="docs-step-num">04</div><div><b>The action runs.</b><span>The final transaction or provider request is submitted through the selected rail and the result is shown back in ROBANK.</span></div></div>
          </section>

          <section id="wallet" className="docs-section">
            <span className="docs-section-kicker">03 / ACCOUNT &amp; WALLET</span>
            <h2>Your financial home.</h2>
            <p>
              The current web entry is email-first through Privy. The user enters a verification code,
              then the authenticated app selects the associated Privy EVM wallet for account context.
              This keeps the public landing and docs usable without authentication while account actions stay behind the app.
            </p>
            <h3>Wallet model</h3>
            <p>
              The wallet is infrastructure around the account. The exact signing and delegated authorization model
              must follow the configured production runtime. Never infer custody or signing properties from the UI alone.
            </p>
            <Code>{`Email + Privy verification
  ↓
Authenticated account
  ↓
Associated Privy EVM wallet
  ↓
Read account / asset / activity state
  ↓
Prepare authorized actions
  ↓
ROBANK app`}</Code>
            <Callout title="Development note">
              The current production-facing configuration targets Base Mainnet
              for payments and supported on-chain operations, with Robinhood Chain Mainnet
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

          <section id="transfers" className="docs-section">
            <span className="docs-section-kicker">05 / TRANSFERS</span>
            <h2>Move supported assets.</h2>
            <p>
              ROBANK supports direct same-network EVM transfers and provider-routed cross-network transfers for supported assets. The interface validates the asset, network and recipient before an action can proceed.
            </p>
            <div className="docs-grid">
              <div className="docs-card"><b>Direct transfer</b><span>Same-network EVM transfers use the selected token contract and the user's wallet.</span></div>
              <div className="docs-card"><b>Cross-network routing</b><span>Supported cross-network transfers use the configured LI.FI route and quote flow.</span></div>
              <div className="docs-card"><b>Recipient validation</b><span>The destination format must match the selected network before a quote or transaction is prepared.</span></div>
              <div className="docs-card"><b>Execution proof</b><span>A transfer is not reported as successful until the wallet/provider returns an actual result.</span></div>
            </div>
            <Code>{`"Send 100 USDC from Base to Arbitrum"

→ validate asset + networks
→ fetch transfer route when needed
→ review fees and destination
→ approve and execute
→ verify result`}</Code>
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
            <h3>Intent → surface → action</h3>
            <p>The agent should route the user's request to the product surface that owns the next step instead of forcing the user to navigate the menu first.</p>
            <table className="docs-table">
              <thead><tr><th>Intent</th><th>Example</th><th>First surface</th><th>Next action</th></tr></thead>
              <tbody>
                <tr><td><strong>Holdings</strong></td><td>“What do I have?”</td><td>Overview</td><td>Read live unified stablecoin balances.</td></tr>
                <tr><td><strong>Payment</strong></td><td>“Pay Alice 20 USDC.”</td><td>Money</td><td>Identify source, asset, recipient and network, then check policy.</td></tr>
                <tr><td><strong>Service / compute</strong></td><td>“Buy me a GPU for 3 hours.”</td><td>Agent Market</td><td>Discover provider → inspect 402 terms → authorize → pay → verify.</td></tr>
                <tr><td><strong>Bounty</strong></td><td>“Post this task for $50.”</td><td>Jobs</td><td>Create prize + deliverable; funding must be verified before claim.</td></tr>
                <tr><td><strong>Card</strong></td><td>“Get me the Visa card.”</td><td>Card</td><td>Check provider state → KYC → issue when available.</td></tr>
                <tr><td><strong>Company</strong></td><td>“Verify my company.”</td><td>Company</td><td>Use exact jurisdictional registry data → provider KYB.</td></tr>
                <tr><td><strong>xStocks</strong></td><td>“Can I use xStocks?”</td><td>xStocks</td><td>Open the current provider-backed stock product catalog.</td></tr>
                <tr><td><strong>Borrow</strong></td><td>“Borrow against my assets.”</td><td>Borrow</td><td>Show discovered provider markets; only expose execution when the provider adapter and eligibility checks are live.</td></tr>
              </tbody>
            </table>
            <h3>Agent response model</h3>
            <Code>{`{
  "action": "holdings | payment | agent-market | bounty | card | company | xstocks | borrow | info",
  "surface": "/markets",
  "requires_approval": true,
  "message": "I found a provider. I’ll inspect the payment terms before paying."
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
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Auto execute:      ON
Daily payment cap: $2,000
Allowed assets:    USDC, ETH
Destinations:      Approved list
RWA access:        Approved providers only
Rebalance:         Monthly`}</Code>
            <Callout title="Design principle">
              “Autonomous” should mean the agent can execute within a mandate â€”
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
            <h3>Install the ROBANK Skill</h3>
            <Code>{`npx skills add Robank-dev/robank-skill`}</Code>
            <p>The Skill gives a compatible agent ROBANK operating rules and reference material. Installing it does not create a wallet, fund an account, or grant signing authority.</p>
            <h3>CLI command families</h3>
            <Code>{`capital Â· holdings Â· borrow Â· payments Â· card
agent Â· jobs Â· company Â· wallet Â· users
autopilot Â· onramp Â· x402 Â· rwa Â· networks Â· updates

Run: robank --help`}</Code>
            <h3>Core API surface</h3>
            <table className="docs-table">
              <thead><tr><th>Endpoint</th><th>Purpose</th></tr></thead>
              <tbody>
                <tr><td><strong>POST /api/agent/chat</strong></td><td>Send a message and receive an agent response/action.</td></tr>
                <tr><td><strong>GET /api/agent-market</strong></td><td>Discover online x402 services and expose market capabilities to the agent UI.</td></tr>
                <tr><td><strong>GET /api/updates</strong></td><td>Read the official ROBANK owner-authored update feed.</td></tr>
                <tr><td><strong>POST /api/kyc/session</strong></td><td>Create a provider verification session when the Didit KYC workflow is connected.</td></tr>
                <tr><td><strong>POST /api/payments/route</strong></td><td>Build payment routing data and fee estimates.</td></tr>
                <tr><td><strong>GET /api/onramp/url</strong></td><td>Create/retrieve an on-ramp entry URL.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="networks" className="docs-section">
            <span className="docs-section-kicker">10 / NETWORKS</span>
            <h2>One financial layer, more than one chain.</h2>
            <p>
              ROBANK is multi-chain. Base and Robinhood Chain are primary product rails, while the current Send/Receive routing layer also supports Ethereum, Arbitrum, Optimism, Polygon, BNB Chain and Solana through configured provider-backed routes.
            </p>
            <table className="docs-table">
              <thead><tr><th>Network</th><th>Role in the design</th><th>Status</th></tr></thead>
              <tbody>
                <tr><td><strong>Base Mainnet</strong></td><td>Primary production rail for supported payment and settlement flows Â· chain ID 8453</td><td><Badge>MAINNET</Badge></td></tr>
                <tr><td><strong>Robinhood Chain Mainnet</strong></td><td>Production rail for supported assets and tokenized-asset integrations Â· chain ID 4663</td><td><Badge>MAINNET</Badge></td></tr>
                <tr><td><strong>Ethereum / Arbitrum / Optimism / Polygon / BNB Chain / Solana</strong></td><td>Supported Send/Receive routing rails when the live provider route and asset are available</td><td><Badge muted>PROVIDER-DEPENDENT</Badge></td></tr>
              </tbody>
            </table>
            <Callout title="Do not hard-code production assumptions">
              Contracts, token addresses, RPC endpoints, supported assets and
              network availability should be treated as environment configuration.
            </Callout>
          </section>

          <section id="assets" className="docs-section">
            <span className="docs-section-kicker">11 / HOLDINGS</span>
            <h2>What can the wallet hold?</h2>
            <p>
              Overview shows the unified balances the user actually holds for the supported stablecoins USDC, USDT and USDG. Market discovery and xStocks remain separate provider-backed surfaces.
            </p>
            <div className="docs-grid">
              <div className="docs-card"><b>USDC</b><span>Primary stablecoin/payment asset in the current Base Mainnet flow.</span></div>
              <div className="docs-card"><b>USDG</b><span>Robinhood Chain Mainnet stablecoin asset used by the current network-aware asset model.</span></div>
              <div className="docs-card"><b>USDT</b><span>Supported stablecoin balance aggregated across configured networks.</span></div>
              <div className="docs-card"><b>Positive balance only</b><span>Zero-balance entries are hidden from the user holdings view.</span></div>
              <div className="docs-card"><b>Separate product rails</b><span>Agent Market, Xstocks and other provider catalogs are not silently mixed into wallet holdings.</span></div>
            </div>
          </section>

          <section id="xstocks" className="docs-section">
            <span className="docs-section-kicker">12 / XSTOCKS</span>
            <h2>Separate the tokenized-equity rail.</h2>
            <p>ROBANK treats Xstocks as a separate, provider-issued product surface. It is not the same as a traditional public equity and it is not an ordinary crypto holding.</p>
            <div className="docs-grid">
              <div className="docs-card"><b>Catalog</b><span>The current web surface is provider-backed discovery. Trading or issuance still requires an actual eligible execution route.</span></div>
              <div className="docs-card"><b>Provider-issued</b><span>Future products must identify the actual issuer/provider, eligibility rules, network and contract/product metadata.</span></div>
              <div className="docs-card"><b>Separate from Holdings</b><span>xStocks products are not silently mixed into the unified stablecoin holdings balance.</span></div>
              <div className="docs-card"><b>Separate from Agent Market</b><span>Xstocks is an investment/asset rail, not a machine-service marketplace.</span></div>
            </div>
            <Callout title="Important">A ticker match does not mean the instruments are the same. ROBANK must verify the provider, product type, jurisdiction and execution path before exposing any action.</Callout>
          </section>

          <section id="markets" className="docs-section">
            <span className="docs-section-kicker">13 / AGENT MARKET &amp; UPDATES</span>
            <h2>Machine services, bounties and the ROBANK feed.</h2>
            <p>The web Markets surface is now the Agent Market: a discovery layer for x402-compatible services plus user-created bounties. Updates remains the owner-authored ROBANK product feed.</p>
            <div className="docs-grid">
              <div className="docs-card"><b>Agent Market</b><span>Discover online x402 services by capability, category, price and supported production network. Discovery does not itself execute a purchase.</span></div>
              <div className="docs-card"><b>x402 execution</b><span>The agent must inspect the provider's actual 402 payment requirement, check policy, pay only when authorized, then verify the returned resource.</span></div>
              <div className="docs-card"><b>Bounties</b><span>Jobs can surface as market bounties. Prize funding, claim, proof, review, dispute and release are separate states.</span></div>
              <div className="docs-card"><b>Updates</b><span>Official ROBANK product notes, launches, build updates and announcements published by the owner/team.</span></div>
            </div>
          </section>

          <section id="company" className="docs-section">
            <span className="docs-section-kicker">14 / COMPANY &amp; KYC / KYB</span>
            <h2>Organization workflows, with verification boundaries.</h2>
            <p>The current web includes a Company surface for adding or registering an existing company. Company records include legal name, registration number, country, status, verification status and provider verification/session context.</p>
            <div className="docs-grid">
              <div className="docs-card"><b>Company record</b><span>Create and manage the organization's core legal information and account context.</span></div>
              <div className="docs-card"><b>KYC / KYB</b><span>Verification is provider-dependent. A UI record is not proof that an external verification has completed.</span></div>
              <div className="docs-card"><b>Agent access</b><span>The agent can work with company context only through the authenticated/authorized runtime path.</span></div>
              <div className="docs-card"><b>Status-first</b><span>Verification states must reflect the actual provider result, not a locally fabricated approval.</span></div>
            </div>
          </section>

          <section id="jobs" className="docs-section">
            <span className="docs-section-kicker">15 / JOBS</span>
            <h2>Turn work into an explicit lifecycle.</h2>
            <p>The current Jobs surface models work that can be created, claimed and submitted by users or agents. The workflow is explicit so a job state is not confused with a payment state.</p>
            <Code>{`open → claimed → in_progress → submitted → approved

Alternative final state:
cancelled`}</Code>
            <div className="docs-grid">
              <div className="docs-card"><b>Create</b><span>Title, description, budget, asset/network context and optional company linkage.</span></div>
              <div className="docs-card"><b>Claim</b><span>A worker or agent claims available work only after the required funding/escrow state is verified.</span></div>
              <div className="docs-card"><b>Submit</b><span>Attach the work result and acceptance evidence to the job record.</span></div>
              <div className="docs-card"><b>Verify &amp; settle</b><span>Approval, dispute and payout are separate states. External claimable bounties are shown as provider opportunities and are not settled by ROBANK.</span></div>
            </div>
          </section>

          <section id="rwa" className="docs-section">
            <span className="docs-section-kicker">16 / TOKENIZED ASSETS</span>
            <h2>Make the agent work with real-world assets.</h2>
            <p>
              ROBANK separates traditional public equities from provider-issued onchain products. Public equities such as AAPL, NVDA and GOOGL
              are market instruments in the Markets surface. Robinhood Stock Tokens and xStocks are different onchain products with their own
              issuer/provider, contract addresses, eligibility and trading rules. ROBANK is not the issuer of those products.
            </p>
            <h3>Example: an agent-managed public-markets basket</h3>
            <p>Underlying tickers in this example are references to public equities. They do not mean ROBANK has issued or purchased matching tokens.</p>
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
              External providers may expose products such as Robinhood Stock Tokens or xStocks. ROBANK can treat those as separate provider rails,
              subject to the actual runtime integration, eligibility, custody, liquidity and execution path. No ROBANK-issued NVDA/AAPL token
              is currently defined by the product.
            </p>
          </section>

          <section id="card" className="docs-section">
            <span className="docs-section-kicker">17 / CARD</span>
            <h2>A card when you need one.</h2>
            <p>
              ROBANK's card concept is a virtual card layer connected to the
              financial account. The user experience stays inside ROBANK while a
              card issuing provider handles the underlying program.
            </p>
            <div className="docs-grid">
              <div className="docs-card"><b>Visa card</b><span>The confirmed card network is Visa. The exact BIN is selected from the BINs available to the ROBANK provider project.</span></div>
              <div className="docs-card"><b>USD</b><span>The card UI is designed around a USD-denominated fiat balance.</span></div>
              <div className="docs-card"><b>Activation + KYC</b><span>Current ROBANK UI shows $5.00 card creation/activation plus $0.50 KYC. Other provider charges are shown only when verified.</span></div>
              <div className="docs-card"><b>KYC is cardholder-level</b><span>Company KYB approval does not automatically approve an individual cardholder. When the selected Buvei BIN has requireKycCardholder=true, the named cardholder must reach APPROVED before issuance.</span></div>
              <div className="docs-card"><b>Provider-backed</b><span>Buvei handles the card program, BIN availability, KYC requirements and card lifecycle. ROBANK does not invent provider limits.</span></div>
            </div>
          </section>

          <section id="security" className="docs-section">
            <span className="docs-section-kicker">18 / SECURITY</span>
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

          <section id="status" className="docs-section">
            <span className="docs-section-kicker">19 / CAPABILITY STATUS</span>
            <h2>Know what is actually available.</h2>
            <p>ROBANK separates UI surfaces, backend routes and real provider execution. A source file existing does not automatically make a capability production-live.</p>
            <table className="docs-table">
              <thead><tr><th>Status</th><th>Meaning</th></tr></thead>
              <tbody>
                <tr><td><Badge>LIVE</Badge></td><td>A working runtime/tool/provider path has been verified for the stated scope.</td></tr>
                <tr><td><Badge> BETA </Badge></td><td>Usable but materially incomplete, unstable or still being hardened.</td></tr>
                <tr><td><Badge muted>PROVIDER-DEPENDENT</Badge></td><td>Requires an external provider, credentials, eligibility, venue or jurisdiction-specific flow.</td></tr>
                <tr><td><Badge muted>PLANNED</Badge></td><td>Designed or documented, but no usable implementation path is currently available.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="roadmap" className="docs-section">
            <span className="docs-section-kicker">20 / ROADMAP</span>
            <h2>Where ROBANK is going.</h2>
            <div className="docs-grid">
              <div className="docs-card"><b>Foundation</b><span>Email/wallet entry, account balance, send, receive and transaction history.</span></div>
              <div className="docs-card"><b>Agent execution</b><span>Natural-language actions, structured tool calls, permissions and delegated execution.</span></div>
              <div className="docs-card"><b>Financial rails</b><span>On-ramp, card/provider integrations, company verification and broader payment routing.</span></div>
              <div className="docs-card"><b>Autonomous finance</b><span>Rules, recurring actions, treasury management, agent-to-agent payments and programmable mandates.</span></div>
              <div className="docs-card"><b>Tokenized assets</b><span>Provider-integrated discovery and execution for supported tokenized real-world asset products.</span></div>
              <div className="docs-card"><b>Borrow</b><span>Provider-backed market discovery across supported lending rails; execution remains gated by provider adapters, eligibility and wallet flow.</span></div>
              <div className="docs-card"><b>More ways to operate</b><span>Terminal, API, workflows and agent-native integrations so ROBANK works beyond one website.</span></div>
            </div>
          </section>

          <section id="faq" className="docs-section">
            <span className="docs-section-kicker">21 / FAQ</span>
            <h2>Questions we expect people to ask.</h2>
            <h3>Is ROBANK a traditional bank?</h3>
            <p>No. The product is designed as an on-chain financial interface and routing layer, not as a conventional deposit-taking bank.</p>
            <h3>Does ROBANK hold my private key?</h3>
            <p>The original architecture is designed so ROBANK does not directly hold the user's private key. The final production signing/delegation model determines the exact execution flow.</p>
            <h3>Can the agent execute transactions?</h3>
            <p>That is a core direction of the product. The important part is the permission model: automatic execution should operate only within the authorization and policy boundaries configured for the account.</p>
            <h3>What is the difference between a stock and a Stock Token?</h3>
            <p>A public stock such as NVDA is a traditional listed equity used by the market-data layer. A Robinhood Stock Token is a separate ERC-20 product issued by Robinhood Assets (Jersey) Limited, and xAAPL/xNVDA are separate xStocks products. Neither is a ROBANK-issued token. The current ROBANK runtime does not expose a live stock-brokerage order path or a live tokenized-asset execution path.</p>
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
