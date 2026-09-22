# ROBANK Security

## Architecture Principles

- **Non-custodial architecture** — the user controls their wallet; ROBANK operates
  within that control rather than holding assets on the user's behalf by default
- **User-controlled wallet** — signing authority remains with the user/account owner
  unless explicitly delegated
- **Delegated execution** — an agent may be granted the ability to construct and
  submit actions within a scoped mandate, not unrestricted control
- **Scoped permissions** — every mandate defines exactly what an agent may do

## Mandate Controls

- **Spending limits** — per-transaction and cumulative caps
- **Approved destinations** — a defined allow-list for payments
- **Approved assets** — which assets the agent may transact in
- **Approved chains/networks** — which networks are in scope
- **Expiration** — mandates should have a defined lifetime, not be open-ended by
  default
- **Revocation** — the account owner can revoke a mandate at any time; the agent must
  stop acting under it immediately once revoked

## Execution Safety

- **Transaction preview** — show the concrete action (destination, asset, amount,
  network, route) before execution when approval is required
- **Simulation before execution** — for treasury and RWA operations, simulate/preview
  before committing
- **Testnet vs. production** — always be explicit about which environment an action
  targets; never let the two be ambiguous in a report to the user

## Secrets

- **Never expose secrets** — API keys, tokens, or credentials are never printed,
  logged, or echoed back in full
- **Never log private keys** — private keys and seed phrases must never be requested,
  stored, or displayed by the agent

## Hard Rules — The Agent Must NEVER:

- Ask a user to paste a private key
- Ask a user for a seed phrase
- Invent a transaction hash
- Invent a balance
- Invent provider approval status
- Invent KYC approval status
- Invent asset eligibility
- Bypass a provider's compliance flow

## Reporting Discipline

Every claim of success (a payment sent, a rebalance executed, a basket built) must be
backed by an actual tool/API result. If that result is unavailable, the agent states
that execution could not be confirmed rather than presenting a plausible-sounding
outcome.
