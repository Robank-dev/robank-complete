# ROBANK HTTP API

Base URL: `https://robank.co`. JSON in, JSON out. Errors are `{"error": "<message>"}` with a meaningful status (400 invalid input, 401 not signed in, 403 forbidden, 404 not found, 409 conflict/state changed, 422 no route, 429 rate limited, 502/503/504 provider unavailable).

## Authentication

`Authorization: Bearer <token>` where token is either a Privy access token (web app) or a personal API key `rbk_…` created on https://robank.co/cli. Keys are shown once, stored hashed, limited to 5 per account, and can be revoked. Keys cannot create or revoke other keys.

The server always uses the wallets linked to the authenticated account. Addresses sent by a client are never trusted for authorization.

## Public endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/status` | Capability states: `live`, `needs-configuration`, `not-available` |
| GET | `/api/stocks` | xStocks + Robinhood Stock Tokens with networks, contracts and reference prices |
| GET | `/api/xstocks` | Raw xStocks catalog (supported networks only) |
| GET | `/api/borrow` | Morpho markets on Base (8453) and Robinhood Chain (4663) |
| GET | `/api/markets` | Reference quotes for a few public equities and BTC/ETH/SOL |
| GET | `/api/agent-market?q=&category=` | x402 services (discovery only) and external bounties |
| GET | `/api/lifi/tokens` | Supported stablecoin contracts per network |

## Authenticated endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/portfolio[?fresh=1]` | Holdings with `raw` base units, `quantity`, `priceUsd`, `valueUsd`, and per-network `sources[]` (`ok: false` means that network could not be read — never treat it as zero) |
| POST | `/api/agent/chat` | `{message, history?}` → `{response, action}`; `action.type` is `none`, `navigate` or `prepare-transfer` (with `path` to the review screen) |
| POST | `/api/lifi/quote` | Cross-network stablecoin quote; source address is the caller's own wallet |
| GET/POST | `/api/jobs` | `?scope=open|mine`; create with `{title, description, rewardAmount?, rewardAsset?, rewardChainId?, dueAt?}` |
| POST | `/api/jobs/:id` | `{action: claim|submit|approve|reject|cancel|record-payout, submission?, txHash?}`. `record-payout` verifies the stablecoin transfer on-chain |
| GET/POST | `/api/companies` | Company profiles owned by the caller |
| POST | `/api/companies/:id/verify` | Starts Didit KYB (only when `kyb` is live) |
| POST | `/api/kyc` | Starts Didit KYC (only when `kyc` is live) |
| POST | `/api/onramp` | `{chainId, asset: "USDC", amount?}` → signed MoonPay URL to the caller's own wallet (only when `onramp` is live) |
| GET | `/api/updates` | Official announcements |

## Rate limits

Per account: agent 15/min and 300/day, portfolio 30/min, quotes 40/min, record creation limited per hour. Respect `Retry-After`.

There is no endpoint that signs or broadcasts a transaction.
