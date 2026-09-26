# ROBANK

Self-custodial money app at **https://robank.co**. Sign in with email, get your own EVM and Solana wallets, see everything you hold across eight networks, send (including cross-network), borrow against collateral, browse tokenized stocks, and ask an AI agent that prepares actions — while only your signature moves funds.

## What is live

`GET /api/status` is the source of truth. Today:

- **Live:** email sign-in with Privy embedded wallets, on-chain portfolio (stablecoins, gas tokens, xStocks, Robinhood Stock Tokens), same-network EVM/Solana transfers, LI.FI cross-network stablecoin transfers, Morpho borrowing on Base and Robinhood Chain, AI agent, jobs, company profiles, updates, CLI/API with personal keys.
- **Not enabled until credentials are set:** MoonPay card/bank purchases, Didit KYC/KYB.
- **Not available:** ROBANK Card, bank payouts, Apple/Google Pay, QR payments.

## Architecture

```
frontend/   Next.js 15 app + API routes, deployed as a Cloudflare Worker via OpenNext
  app/            pages and /api/* routes (server code runs on the Worker)
  lib/chains.ts   verified network + token registry shared by UI, API, agent
  lib/server/     auth (Privy / API keys), D1 access, rate limits, portfolio engine, provider adapters
  migrations/     D1 schema
cli/        dependency-free Node CLI (read, ask, prepare) and the ROBANK Skill docs
```

- **Custody:** Privy embedded wallets. There is no server-side signing anywhere.
- **Auth:** every protected route verifies the Privy access token (or a hashed `rbk_` API key) and derives wallets from Privy — client-supplied addresses are never trusted.
- **Storage:** Cloudflare D1 (`robank-db`) for jobs, companies, updates, API keys and rate limits. Balances are always read on-chain.
- **Providers:** Morpho GraphQL, LI.FI, xStocks, Robinhood, Nasdaq screener (reference prices), LI.FI/Coinbase (native prices), x402-list, Agent Bounties, MoonPay, Didit, an OpenAI-compatible LLM endpoint.

## Configuration

Worker secrets (`npx wrangler secret put NAME` in `frontend/`):

| Secret | Purpose |
|---|---|
| `PRIVY_APP_ID`, `PRIVY_APP_SECRET` | Sign-in and server-side token verification (required) |
| `ROBANK_LLM_API_KEY`, `ROBANK_LLM_BASE_URL`, `ROBANK_LLM_MODEL` | AI agent conversation |
| `MOONPAY_API_KEY`, `MOONPAY_SECRET_KEY` | Enables card/bank USDC purchases |
| `DIDIT_API_KEY`, `DIDIT_KYC_WORKFLOW_ID`, `DIDIT_KYB_WORKFLOW_ID` | Enables identity / company verification |
| `SOLANA_RPC_URL` | Optional dedicated Solana RPC (public RPCs rate-limit) |
| `LIFI_API_KEY`, `ROBANK_LIFI_FEE_BPS` | Optional LI.FI key and integrator fee (≤ 100 bps) |
| `ROBANK_OWNER_EMAIL`, `ROBANK_OWNER_WALLET` | Accounts allowed to publish Updates (comma-separated) |

A feature whose credentials are missing shows as "Not enabled" everywhere — it never pretends to work.

## Development

```
npm run install:all
cp frontend/.dev.vars.example frontend/.dev.vars   # fill in values
cd frontend
npx wrangler d1 migrations apply robank-db --local
npm run preview        # full Worker runtime locally (Privy sign-in only works on allowed origins)
```

`npm run build` regenerates the agent's Skill context from `cli/skill` (see `frontend/scripts/sync-skill.mjs`).

## Deploy

```
cd frontend
npx wrangler d1 migrations apply robank-db --remote
npm run deploy
```

## CLI

```
npm install -g ./cli
robank login        # paste a key created at robank.co/cli
robank balance
robank send 25 USDC 0x… --chain base    # prints a review link; nothing is sent
```

## Security

Report issues to contact@robank.co. ROBANK never asks for seed phrases, private keys or verification codes.
