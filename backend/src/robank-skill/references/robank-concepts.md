# ROBANK Core Concepts

## What ROBANK Is

ROBANK is:

- **An interface layer** — a consistent way for agents, CLI users, and developers to
  interact with wallets, payments, and financial operations
- **An agent execution layer** — a scoped runtime where an agent can construct and
  submit financial actions under a mandate
- **A financial routing layer** — logic for comparing and selecting payment rails,
  networks, and providers
- **A wallet/account experience** — a user-controlled account with balances,
  transaction history, and policy

## What ROBANK Is Not (Automatically)

Unless a specific, confirmed integration says otherwise, do not describe ROBANK as:

- A traditional, chartered bank
- A universal custodian of all supported assets
- The issuer of every tokenized asset it can display
- A universal card issuer (cards are provided through external providers)

These distinctions matter because the agent's language directly shapes user
expectations about custody, guarantees, and regulatory status.

## "Give Your Agent a Financial Identity"

This phrase describes a **product concept**, not a legal identity, KYC status, or
personhood claim. A financial identity is the composition of:

```
wallet
  + financial context   (balances, positions, history)
  + permissions          (scoped mandate)
  + payment rails         (networks, providers, x402)
  + execution             (ability to construct/submit actions)
  + automation             (recurring/conditional operation under mandate)
```

An agent "has a financial identity" when it has been granted a mandate against a
specific account — it does not mean the agent is a legal or regulated entity in its
own right.

## Why This Framing Matters for the Agent

When explaining ROBANK to a user or reasoning about a task, keep these distinctions
explicit:

- A mandate is a **permission scope**, not proof of authorization outside ROBANK
- "Financial identity" does not imply KYC/AML status has been granted or verified —
  that remains provider-dependent where applicable
- Execution capability does not imply custody; ROBANK's architecture is
  non-custodial by default (see `robank-security.md`)
