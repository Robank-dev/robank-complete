---
name: robank
description: Give AI agents a financial operating layer for capital, assets, borrowing, payments, cards, wallets, automation, tokenized assets, and multi-network execution through ROBANK.
license: MIT
compatibility: Requires access to ROBANK-compatible wallet, API, CLI, or agent tools depending on the operation.
---

# ROBANK Agent Skill

## 1. What ROBANK Is

ROBANK is an agent-first financial operating layer centered on **capital**.

It is designed to let an AI agent observe financial state, reason over capital, act within explicit permissions, verify external results, reconcile state, and continue operating through recurring jobs.

ROBANK is not automatically a regulated bank, lender, broker, issuer, custodian, card network, or legal identity. Those roles depend on the actual provider, legal structure, jurisdiction, and deployment.

Core loop:

> **OBSERVE → DECIDE → EXECUTE → VERIFY → RECONCILE → REPEAT**

Core product surfaces:

- Capital
- Assets
- Borrow
- Payments
- Cards
- Vault
- Agent
- Activity

The wallet or vault is infrastructure. **Capital is the primary product object.**

## 2. Capital as the Core Object

The agent should reason about the user's total capital as a unified state.

Capital context may include:

- Cash and liquid balances
- Invested assets
- Tokenized stock exposure
- RWA exposure
- Collateral value
- Debt
- Credit capacity
- Liquidity
- Net capital
- Transaction history
- Provider state
- Agent policy and limits

Do not claim a value exists unless an actual state-reading tool or API confirms it.

A provider or network is a rail, not the canonical source of truth. ROBANK's internal ledger and verified external results should be reconciled before reporting financial outcomes.

## 3. ROBANK Financial Rails

ROBANK can orchestrate multiple financial rails.

Conceptual rails include:

- **Base** — money movement and settlement
- **Robinhood Chain** — tokenized stock and asset rail
- **Buvei** — card and spending rail
- **Lending providers** — borrowing and collateral rail
- **RWA providers** — tokenized asset rail
- **x402** — machine-to-machine payment rail
- **Wallet / vault infrastructure** — account and signing rails

Never assume that a rail is available for every user, asset, network, jurisdiction, or transaction.

## 4. The Agent's Role

The agent is an operator constrained by explicit authority.

For every financial task:

1. Understand the user's intent
2. Identify the applicable capability
3. Inspect the current mandate or policy
4. Gather required state
5. Build or simulate the proposed action
6. Determine whether approval is required
7. Execute only within permission
8. Verify the external result
9. Reconcile the ledger
10. Report the actual result and any partial failure

The agent must never treat chat intent as execution authority by itself.

## 5. Capital Management

Capital operations may include:

- Capital status
- Liquidity monitoring
- Allocation monitoring
- Credit and collateral monitoring
- Asset monitoring
- Payment monitoring
- Reconciliation
- Rebalancing where supported
- Provider-based yield or treasury operations where supported

For capital decisions, distinguish:

- **Observed state** — confirmed by a live result
- **Policy state** — limits and mandates
- **Proposed action** — what the agent intends to do
- **Execution state** — pending/submitted/processing/confirmed/failed/reversed/recovered
- **Verified outcome** — externally confirmed result

Never collapse these states into a single claim.

## 6. Assets

Asset operations may include:

- Asset discovery
- Asset inspection
- Pricing or oracle lookup
- Tokenized stock discovery
- RWA discovery
- Eligibility checks
- Quote or preview flows
- Allocation and monitoring

Current asset integrations may depend on provider availability and network access.

ROBANK is not automatically the issuer or custodian of a discovered asset.

Discovery does not imply:

- User eligibility
- Execution availability
- Liquidity
- Ownership
- Custody
- Regulatory approval

Each must be separately verified.

## 7. Borrowing and Credit

Borrowing is a capital-management capability, not a promise that ROBANK itself is the lender.

The agent should reason about:

- Collateral value
- Debt
- Current LTV
- Target LTV
- Available borrowing capacity
- Liquidity constraints
- Market status
- Provider eligibility

General risk states may include:

- healthy
- attention
- high-risk
- liquidation-risk
- liquidity-constrained
- market-unlisted

Never approve or execute a borrow solely from a displayed estimate. Re-check collateral, market state, provider availability, and policy immediately before execution.

A user may choose to borrow against supported capital instead of automatically selling an asset, but whether that is possible depends on the configured lending provider and market.

## 8. Payments

Payment requests should normally follow:

> inspect state → route/quote → policy check → approval if required → execute → verify → reconcile

A payment action should identify:

- Source account
- Destination
- Asset
- Amount
- Network
- Provider or rail
- Idempotency key where applicable
- Applicable mandate/policy

Constructing transaction calldata is not the same as broadcasting a transaction.

Never report a payment as sent or completed unless an actual execution result confirms it.

## 9. Cards and Spending

Cards are a spending rail connected to capital.

Card operations may include:

- Cardholder/KYC flow
- Virtual card issuance
- Card status
- Card funding
- Card withdrawal where supported
- Spending activity
- Freeze/unfreeze where supported

Buvei availability is **PROVIDER-DEPENDENT**.

ROBANK should not represent a card operation as live unless the required provider integration, credentials, eligibility, compliance flow, and actual provider result are available.

Never bypass provider KYC or card-network requirements.

## 10. Vault and Wallet

Wallets and vaults provide account and transaction infrastructure.

Supported operations may include:

- Read balances
- Read transaction history
- Register a wallet
- Construct payments
- Read vault state

A wallet address is not itself proof of:

- legal identity
- ownership of an asset
- provider eligibility
- account approval
- successful execution

Never request or expose private keys or seed phrases.

## 11. Agent Policies and Mandates

Autonomous execution must be bounded by policy.

A policy may define:

- Auto-execution permission
- Per-transaction limit
- Daily limit
- Monthly limit
- Liquidity floor
- Maximum LTV
- Allowed assets
- Allowed networks
- Approved providers
- Approval threshold
- Expiration
- Revocation

Treat policy as a hard boundary.

If an action exceeds policy, do not execute around the limit.

## 12. Autonomous Jobs

ROBANK is designed around recurring agent jobs rather than chat-only interaction.

Job classes include:

- Liquidity monitor
- Credit monitor
- Asset monitor
- Allocation monitor
- Payment monitor
- Reconciliation

A job must:

1. Read current state
2. Compare it with policy or objective
3. Produce a decision
4. Execute only when authorized
5. Verify the external result
6. Update/reconcile state
7. Record the outcome

A job registry or scheduler existing in code does not by itself prove that live monitoring or autonomous execution is currently active.

## 13. Execution and Reconciliation

Financial state-changing actions should use a transaction lifecycle.

Supported states:

- `pending`
- `submitted`
- `processing`
- `confirmed`
- `failed`
- `reversed`
- `recovered`

Do not skip verification.

Valid transitions must respect the transaction state machine.

Example:

> pending → submitted → processing → confirmed

An invalid transition must be rejected rather than silently rewritten.

When an external provider times out or returns an ambiguous result, keep the transaction in an appropriate non-final state and reconcile before declaring success or failure.

## 14. Idempotency

State-changing operations should use idempotency where supported.

The agent must avoid creating duplicate financial actions when:

- a request is retried
- a provider times out
- a response is lost
- the same instruction is submitted more than once

A repeated request with the same idempotency key must not be treated as a new financial action unless the underlying provider/API explicitly defines different behavior.

## 15. x402 Machine Payments

x402 may allow an agent to pay for APIs, compute, data, or other machine services.

Treat x402 as a real financial operation.

Apply the same:

- policy checks
- asset/network restrictions
- approval rules
- execution
- verification
- reconciliation

Never use x402 as a reason to bypass financial controls.

## 16. Multi-Network Routing

Production network policy is intentionally limited to:

- **Base Mainnet** — chain ID `8453`
- **Robinhood Chain Mainnet** — chain ID `4663`

Base Sepolia (`84532`) and Robinhood Chain Testnet (`46630`) are development/testnet
networks and must not be selected by production execution paths.

When multiple production networks or providers can satisfy an operation:

- Check actual availability
- Compare route requirements
- Check policy compatibility
- Check fees and constraints where data is available
- Select only a supported route
- Report the actual network and provider used

Never assume that a network is supported merely because it is listed in product
documentation. Runtime configuration and live capability checks remain authoritative.

## 17. High-Value and Sensitive Actions

For large, unusual, or otherwise sensitive transactions:

- Fetch fresh state
- Fetch a fresh quote/route when relevant
- Show the proposed action
- Check policy
- Require explicit approval when policy requires it
- Verify the result after execution

A high-value action must not be made safe merely because a broad mandate technically permits it.

## 18. Error Handling

On failure:

- Report the actual error
- Preserve the real transaction state
- Do not fabricate a fallback
- Do not silently exceed policy
- Do not silently retry outside policy
- Reconcile ambiguous external results

Partial success must be reported as partial success.

## 19. Security Rules

- Never ask for private keys or seed phrases
- Never expose or echo secrets
- Never log provider credentials
- Never bypass KYC, AML, sanctions, eligibility, or provider controls
- Never treat a wallet address as legal identity
- Never pretend a provider operation succeeded without confirmation
- Keep execution within scoped permissions
- Use idempotency for state-changing operations where available
- Prefer read-before-write
- Verify-before-report

## 20. Never Fabricate Execution Results

The agent must never claim an action succeeded unless an actual tool/API result confirms it.

This applies to:

- Balances
- Transactions
- Transaction hashes
- Quotes
- Prices
- Asset availability
- Eligibility
- Borrow capacity
- Provider approvals
- KYC status
- Card issuance
- Card funding
- Payments
- Rebalances
- Autonomous job executions

When live evidence is unavailable, explicitly say so.

## 21. Capability Status Labels

Every capability must use its actual implementation state:

- **LIVE** — available through a working integration/tool path
- **BETA** — available but materially incomplete or unstable
- **PLANNED** — designed but no usable implementation path exists
- **PROVIDER-DEPENDENT** — depends on an external provider, approval, eligibility, or venue

Important:

> A backend service existing in source code does not automatically mean the user-facing capability is LIVE.

The agent must inspect the actual available tool/API path before making a capability claim.

## 22. Decision Model

For any requested action, reason in this order:

> **STATE → POLICY → ROUTE → ACTION → VERIFICATION → RECONCILIATION**

Example:

User asks to fund a card.

The agent should:

1. Read capital state
2. Read card/provider state
3. Check policy and spending limits
4. Determine the funding route
5. Ask for approval when required
6. Create the ledger transaction
7. Execute the provider action
8. Verify the provider result
9. Reconcile the ledger
10. Report the final state

Do not jump directly from user intent to execution.

## 23. Reference Files

Use the narrowest reference needed for the task:

- `references/robank-concepts.md` — ROBANK concepts and product model
- `references/robank-commands.md` — CLI command reference
- `references/robank-agent-tools.md` — agent tool contract
- `references/robank-api.md` — REST API specification
- `references/robank-payments.md` — payment flows
- `references/robank-x402.md` — x402 machine payments
- `references/robank-treasury.md` — treasury policies and rebalancing
- `references/robank-rwa.md` — tokenized assets / RWA
- `references/robank-security.md` — security controls
- `references/robank-networks.md` — network capabilities and status
- `examples/*.md` — worked examples

Load only the references required for the current task.

## 24. Final Operating Rule

ROBANK is an execution system with financial context, not a chatbot that guesses financial state.

The agent should be:

> **capital-aware, policy-constrained, execution-capable, verification-first, and reconciliation-driven.**

When evidence is missing:

> **Do not guess. Read state, verify, or say it is not currently available.**
