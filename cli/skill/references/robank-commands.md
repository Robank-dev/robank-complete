# ROBANK CLI Commands

**Status: CURRENT REPOSITORY CLI SURFACE.**

These commands match the ROBANK CLI exposed by the current repository. A command being present in the CLI does not by itself prove that its underlying provider or financial execution path is production-live.

Run:

```bash
robank --help
```

## Capital

```text
robank capital status
robank capital activity
robank capital power
```

Read capital/account context and the available capital-power surface.

## Assets

```text
robank assets discover
robank assets inspect <symbol>
```

Discover or inspect supported asset metadata through the configured runtime.

## Loan (coming soon)

Loan command operations will be added only when the provider-backed rail is enabled.
## Payments

```text
robank payments route --to <address> --amount <amount> --token USDC
```

Build payment routing information. Final execution and confirmation depend on the configured wallet/API path.

## Card

```text
robank card status
robank card fund --amount <amount>
```

Inspect or fund the card surface where the provider integration is available.

## Agent

```text
robank agent chat <message>
robank agent status
```

Send a natural-language request to the agent or inspect agent status.

## Jobs

```text
robank jobs list
robank jobs create --title <title> --description <text> [--budget <amount>]
robank jobs claim <job-id>
robank jobs submit <job-id> --text <submission>
```
## Company

```text
robank company list
robank company add --name <legal-name> [--registration <number>]
robank company verify <company-id>
```

Manage company records and enter the verification workflow. KYC/KYB is provider-dependent and must never be fabricated.

## Wallet and account context

```text
robank wallet
robank wallet set <address>
robank wallet balance
robank wallet transactions
robank users register
```

Inspect wallet context, set a CLI wallet address when the current runtime requires it, read balances/history, or register the CLI user context.

## System

```text
robank status
robank config get
robank config set <base-url|wallet-address> <value>
robank autopilot status
```

Inspect runtime status/configuration and the current autopilot status.
## Agent Market

The current web Agent Market discovers x402-compatible services and exposes bounties created through Jobs. The CLI does not yet expose a dedicated `agent-market` command family, so do not invent one.

For x402 CLI actions:

```text
robank x402 inspect <url>
robank x402 pay <url>
robank x402 retry <url>
```

Inspect the actual 402 requirement before paying. Payment remains subject to mandate, network, asset and execution availability.

## Other command families

```text
robank onramp url [--amount <amount>]
robank swap quote
robank swap execute
robank rwa discover
robank rwa eligibility
robank rwa quote <product-or-basket>
robank rwa execute <product-or-basket>
robank networks list
robank networks inspect <network>
```

These commands expose funding entry points, swaps, tokenized assets and network inspection. Actual provider availability and state-changing execution remain runtime-dependent.

## Authentication note

The current CLI help does not expose a completed `robank auth login` command. Do not document browser/Privy CLI account authorization as implemented until that flow is actually connected and tested.

For web users, the current account entry is email + Privy verification followed by the associated Privy EVM wallet.
