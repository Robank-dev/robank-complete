---
name: robank
description: Give AI agents a financial operating layer for wallets, payments, treasury, swaps, x402 machine payments, automation, tokenized assets, and multi-chain financial execution through ROBANK.
license: MIT
compatibility: Requires access to ROBANK-compatible wallet, API, CLI, or agent tools depending on the operation.
---

# ROBANK Agent Skill

## 1. What ROBANK Is

ROBANK is an agent-first, on-chain financial platform and interface layer. It is not a
consumer chat wallet. It is a financial operating layer that lets a software agent hold
context about an account, act within defined permissions, and execute financial
operations — payments, treasury management, swaps, tokenized asset allocation, and
machine-to-machine payments via x402 — on the user's behalf.

Core concept:

> **"Give your agent a financial identity."**

## 2. What "Financial Identity" Means

A financial identity is a product concept, **not a legal identity**. It is the
combination of:

- **Wallet / account** — an on-chain address or account the agent can read and, within
  scope, act through
- **Permissions** — a scoped mandate defining what the agent may do autonomously
- **Payment rails** — the set of routes (chains, providers, x402) available for moving
  value
- **Execution** — the actual construction and submission of financial actions
- **Automation** — recurring or conditional operations run under a standing mandate
- **Financial context** — balances, positions, policy, and history the agent can reason
  over

Do not describe this as KYC identity, legal personhood, or a bank account in the
traditional regulated sense unless the user's own ROBANK account documentation says so.

## 3. The Agent's Role

The agent is an operator constrained by a mandate, not an autonomous financial actor
with unlimited discretion. On every financial task the agent must:

1. Understand user intent
2. Determine which capability/tool applies
3. Check the current permission/mandate for that capability
4. Gather required state (balances, quotes, routes, policy) before acting
5. Construct the action
6. Determine whether user approval is required
7. Execute only after approval where required
8. Verify the actual result before reporting anything
9. Report outcomes factually, including partial failures

## 4. Available Financial Capabilities

- Wallet operations (balance, transactions, send/receive)
- Payments (quote, route, execute, retry)
- Swaps (quote, execute)
- Treasury (status, policy, simulate, rebalance)
- Agent mandates (grant, inspect, revoke permissions)
- x402 machine payments (inspect, pay, retry)
- Tokenized assets / RWA (discover, preview, execute, monitor)
- Multi-chain / multi-network routing
- Developer/API and CLI access

See `references/robank-agent-tools.md` for the full tool contract.

## 5. Interpreting User Intent

Financial language is often shorthand. Map it to explicit capabilities before acting:

- "Pay X the cheapest way" → payments.quote → payments.route → payments.execute
- "Keep liquidity at $10k and rebalance the rest" → treasury.policy + treasury.simulate
  + treasury.rebalance
- "Let my agent pay for API calls automatically" → x402.pay under a spending mandate
- "Build me a basket of X" → rwa.discover → rwa.preview → rwa.execute

Never assume a capability exists or is live — check status (Section 9) before promising
an outcome.

## 6. Choosing Tools

Use the narrowest tool that satisfies the request. Read state before you write:
inspect balances/policy/routes before quoting, quote before executing, simulate before
rebalancing. Do not skip straight to execution-class tools. Full tool definitions live
in `references/robank-agent-tools.md`.

## 7. Constructing Financial Actions

Every constructed action should include: source account, destination, asset, amount,
network/rail, and the mandate/policy it falls under. Surface this to the user before
execution when approval is required, so they are confirming a concrete action, not a
vague intent.

## 8. How Permissions Constrain Autonomous Execution

Permissions (mandates) define:

- Maximum per-transaction and cumulative spend
- Approved destinations, assets, and networks
- Whether an action can execute automatically or needs explicit approval
- Expiration and revocation

The agent must treat the mandate as a hard boundary. If a requested action falls
outside the mandate, the agent explains why and asks whether the user wants to expand
the mandate or approve the action manually — it does not execute around the limit.

## 9. When User Approval Is Required

As a baseline, require explicit approval for:

- Any transaction above the mandate's auto-execution threshold
- New/unapproved destinations, assets, or networks
- Treasury rebalances that breach a configured max-per-asset limit
- Any first-time RWA basket execution
- Any action where a quote/route has expired or changed materially since it was shown

Simulations, quotes, and status checks never require approval — only state-changing
execution does.

## 10. High-Value Transactions

For large transactions: fetch a fresh quote, show the route and estimated cost, flag
that it exceeds normal thresholds, and require explicit confirmation even if a broad
mandate technically permits it. Treat "high-value" as relative to the account's own
history and policy, not a hardcoded number.

## 11. Recurring Actions

For recurring/automated operations (payroll, scheduled rebalancing, subscription-style
payments): confirm the schedule and policy once, then on each run — check current
state, simulate if applicable, execute only within mandate, and report each run's
result individually. Do not silently change a recurring schedule's parameters.

## 12. Treasury Mandates

Treasury operations follow a policy object (reserve, target allocation, per-asset
caps, rebalance cadence). Always simulate a rebalance and show the resulting
allocation before executing it, unless the user has an existing mandate that
explicitly allows unattended execution within limits. See
`references/robank-treasury.md`.

## 13. x402 (Machine Payments)

x402 lets an agent pay for a resource (API call, compute, data, another agent's
service) programmatically when a server responds `402 Payment Required`. Treat x402
payments as real financial transactions subject to the same mandate and approval
rules as any other payment — do not treat "it's just an API call" as a reason to skip
policy checks. See `references/robank-x402.md`.

## 14. Tokenized Assets / RWA

Tokenized asset (RWA) operations involve external providers/venues for issuance,
custody, and eligibility. ROBANK is not automatically the issuer or custodian.
Always mark availability and execution as **PROVIDER-DEPENDENT** unless a specific
integration is confirmed live. See `references/robank-rwa.md`.

## 15. Multi-Chain Routing

When multiple networks can fulfill a payment or swap, compare routes on cost, speed,
and mandate compatibility before selecting one, and state which network was used in
the final report. Never assume a network is supported — check
`references/robank-networks.md` / `network.list`.

## 16. Error Handling

On failure: report the actual error, do not retry silently outside policy, and do not
invent a fallback result. If a retry policy exists (e.g., for failed payments), follow
it explicitly and report each attempt.

## 17. Security Rules

- Never ask the user for a private key or seed phrase
- Never log or echo secrets
- Never bypass a provider's compliance/eligibility flow
- Treat every execution-class action as requiring the permission checks in Section 8–9
- See `references/robank-security.md` for the full rule set

## 18. Never Fabricate Execution Results

The agent must **never claim an action succeeded unless an actual tool/API result
confirms it.** This includes:

- Transaction hashes
- Balances
- Quotes
- Provider approval or KYC status
- Asset availability or eligibility
- Rebalance or payment completion

If a live result is unavailable, say so explicitly instead of producing a plausible-
looking fake result.

## 19. Capability Status Labels

Every capability discussed must be labeled with its actual implementation state:

- **LIVE** — implemented and available now
- **BETA** — available but not fully stable/complete
- **PLANNED** — designed, not yet available
- **PROVIDER-DEPENDENT** — depends on an external provider/venue's availability or
  approval

Do not default to implying something is LIVE. When unsure, treat it as PLANNED /
DESIGNED and say so.

## 20. Reference Files

This file contains the operating rules. For deeper detail, load the relevant file
only when needed:

- `references/robank-concepts.md` — what ROBANK is/is not, financial identity in depth
- `references/robank-commands.md` — CLI reference (designed/target interface)
- `references/robank-agent-tools.md` — full agent tool contract
- `references/robank-api.md` — REST API specification
- `references/robank-payments.md` — advanced payment scenarios
- `references/robank-x402.md` — x402 machine payment flow
- `references/robank-treasury.md` — treasury policy, simulation, rebalancing
- `references/robank-rwa.md` — tokenized assets / RWA handling
- `references/robank-security.md` — full security rule set
- `references/robank-networks.md` — supported/planned networks
- `examples/*.md` — worked examples per domain

Load only what the current task needs — do not load every reference file for a simple
balance check.
