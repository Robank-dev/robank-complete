# ROBANK API Reference

**Base URL:** runtime-specific. Do not hard-code a production API domain in clients unless the deployment environment provides it.

## Current web Agent Market route

### GET /api/agent-market

**Purpose:** Return x402 service discovery data and open bounties for the ROBANK Agent Market.

**Status:** LIVE for the current web runtime through the frontend proxy, backed by the external x402-list directory and the configured Jobs API where available.

**Important:** This is discovery, not execution. A listed service is not automatically safe, eligible, or purchased. The agent must inspect the provider's actual HTTP 402 requirement before paying.

### GET /api/markets

**Purpose:** Legacy market-data endpoint retained for compatibility; it is no longer the primary web Markets surface.

**Status:** LEGACY / NOT USED BY THE CURRENT WEB MARKETS UI.

**Important:** Do not present its stock/crypto data as the Agent Market.

```
https://api.robank.example
```

## Authentication

```
Authorization: Bearer <API_KEY>
```

All endpoints require a valid bearer token scoped to the calling account/agent
mandate, except where noted.

---

## GET /v1/wallet/balance

**Purpose:** Return current balances for the authenticated account.

**Request:**
```http
GET /v1/wallet/balance HTTP/1.1
Authorization: Bearer <API_KEY>
```

**Response:**
```json
{
  "account_id": "acct_123",
  "balances": [
    { "asset": "USDC", "amount": "10432.55", "network": "base" },
    { "asset": "ETH", "amount": "1.204", "network": "base" }
  ],
  "as_of": "2026-09-22T10:00:00Z"
}
```

**Errors:** `401 unauthorized`, `404 account_not_found`

**Status:** PROVIDER-DEPENDENT / PLANNED

---

## GET /v1/wallet/transactions

**Purpose:** Return transaction history for the account.

**Request:**
```http
GET /v1/wallet/transactions?limit=20 HTTP/1.1
Authorization: Bearer <API_KEY>
```

**Response:**
```json
{
  "transactions": [
    {
      "id": "tx_001",
      "type": "payment",
      "status": "settled",
      "asset": "USDC",
      "amount": "120.00",
      "network": "base",
      "created_at": "2026-09-20T14:32:00Z"
    }
  ]
}
```

**Errors:** `401 unauthorized`

**Status:** PLANNED

---

## POST /v1/agent/chat

**Purpose:** Send a natural-language instruction to the ROBANK agent runtime.

**Request:**
```json
{
  "message": "Pay the compute provider $120 using the cheapest available rail.",
  "session_id": "sess_abc"
}
```

**Response:**
```json
{
  "reply": "Cheapest route is Base via USDC, est. fee $0.02. Confirm to execute?",
  "requires_confirmation": true,
  "proposed_action": { "type": "payment", "amount": "120.00", "asset": "USDC" }
}
```

**Errors:** `401 unauthorized`, `422 invalid_message`

**Status:** BETA

---

## POST /v1/payments/quote

**Purpose:** Get a quote for a payment.

**Request:**
```json
{ "destination": "acct_456", "asset": "USDC", "amount": "120.00" }
```

**Response:**
```json
{
  "quote_id": "quote_789",
  "fee": "0.02",
  "rate": 1.0,
  "expires_at": "2026-09-22T10:05:00Z"
}
```

**Errors:** `400 invalid_amount`, `404 destination_not_found`

**Status:** PLANNED

---

## POST /v1/payments/execute

**Purpose:** Execute a previously quoted payment.

**Request:**
```json
{ "quote_id": "quote_789" }
```

**Response:**
```json
{
  "status": "settled",
  "transaction_id": "tx_002",
  "network": "base"
}
```

**Errors:** `409 quote_expired`, `403 mandate_exceeded`

**Status:** PLANNED

---

## POST /v1/payments/route

**Purpose:** Compare available payment rails for a given payment.

**Request:**
```json
{ "destination": "acct_456", "asset": "USDC", "amount": "50000.00" }
```

**Response:**
```json
{
  "routes": [
    { "network": "base", "est_fee": "0.05", "est_time_sec": 4 },
    { "network": "arbitrum", "est_fee": "0.08", "est_time_sec": 6 }
  ]
}
```

**Errors:** `400 invalid_amount`

**Status:** PLANNED

---

## POST /v1/swap/quote

**Purpose:** Quote a swap between two assets.

**Request:**
```json
{ "asset_in": "ETH", "asset_out": "USDC", "amount_in": "1.0" }
```

**Response:**
```json
{ "quote_id": "swapq_001", "amount_out": "3120.44", "slippage": "0.1%" }
```

**Errors:** `400 unsupported_pair`

**Status:** PLANNED

---

## POST /v1/swap/execute

**Purpose:** Execute a previously quoted swap.

**Request:**
```json
{ "quote_id": "swapq_001" }
```

**Response:**
```json
{ "status": "settled", "transaction_id": "tx_003" }
```

**Errors:** `409 quote_expired`

**Status:** PLANNED

---

## POST /v1/treasury/simulate

**Purpose:** Simulate a rebalance against configured treasury policy.

**Request:**
```json
{ "treasury_id": "trs_001" }
```

**Response:**
```json
{
  "simulation_id": "sim_001",
  "current_allocation": { "USDC": 0.55, "ETH": 0.25, "RWA": 0.20 },
  "target_allocation": { "USDC": 0.40, "ETH": 0.30, "RWA": 0.30 },
  "required_trades": [
    { "action": "sell", "asset": "USDC", "amount": "1500.00" },
    { "action": "buy", "asset": "RWA_BASKET_TECH", "amount": "1500.00" }
  ]
}
```

**Errors:** `404 treasury_not_found`

**Status:** PLANNED

---

## POST /v1/treasury/rebalance

**Purpose:** Execute a rebalance, optionally from a prior simulation.

**Request:**
```json
{ "treasury_id": "trs_001", "simulation_id": "sim_001" }
```

**Response:**
```json
{ "status": "executed", "trades": [ { "id": "tx_004", "status": "settled" } ] }
```

**Errors:** `403 exceeds_max_per_asset`, `409 simulation_expired`

**Status:** PLANNED

---

## GET /v1/treasury/status

**Purpose:** Return current treasury allocation and policy.

**Request:**
```http
GET /v1/treasury/status?treasury_id=trs_001 HTTP/1.1
```

**Response:**
```json
{
  "reserve": { "asset": "USDC", "amount": "10000.00" },
  "target_allocation": { "USDC": 0.40, "ETH": 0.30, "RWA": 0.30 },
  "current_allocation": { "USDC": 0.55, "ETH": 0.25, "RWA": 0.20 },
  "max_per_asset": 0.20,
  "rebalance_cadence": "monthly"
}
```

**Errors:** `404 treasury_not_found`

**Status:** PLANNED

---

## GET /v1/rwa/assets

**Purpose:** List available tokenized asset products.

**Response:**
```json
{
  "assets": [
    { "symbol": "NVDA", "provider": "example-venue", "eligibility": "provider-dependent" }
  ]
}
```

**Status:** PROVIDER-DEPENDENT / PLANNED

---

## GET /v1/rwa/baskets

**Purpose:** List the account's tokenized asset baskets/positions.

**Status:** PROVIDER-DEPENDENT / PLANNED

---

## POST /v1/rwa/baskets/preview

**Purpose:** Preview a basket composition before execution.

**Request:**
```json
{ "composition": { "NVDA": 0.30, "AAPL": 0.25, "MSFT": 0.25, "TSM": 0.20 } }
```

**Status:** PROVIDER-DEPENDENT / PLANNED

---

## POST /v1/rwa/baskets/execute

**Purpose:** Execute a previewed basket.

**Request:**
```json
{ "preview_id": "prev_001" }
```

**Status:** PROVIDER-DEPENDENT / PLANNED

---

## POST /v1/x402/pay

**Purpose:** Pay a `402 Payment Required` requirement and return the retried resource.

**Request:**
```json
{
  "payment_requirement": { "amount": "0.05", "asset": "USDC", "network": "base" },
  "resource_url": "https://api.example-provider.com/inference"
}
```

**Response:**
```json
{ "status": "paid", "transaction_id": "tx_005", "resource_status": 200 }
```

**Errors:** `402 payment_failed`, `403 mandate_exceeded`

**Status:** PLANNED

---

## GET /v1/networks

**Purpose:** List supported/planned networks.

**Response:**
```json
{
  "networks": [
    { "name": "base", "chain_id": 8453, "status": "mainnet" },
    { "name": "robinhood", "chain_id": 4663, "status": "mainnet" }
  ]
}
```

**Status:** PLANNED

---

**Note on status labels:** every endpoint above is documented as a target
specification. Treat the API capability itself as **PLANNED** unless the calling
environment confirms a live backend for that endpoint. Network names and chain IDs
above identify the intended production networks; they do not prove that ROBANK has a
live integration. Never present sample responses as real data.

**Production network rule:** production configuration must use Base Mainnet (`8453`)
or Robinhood Chain Mainnet (`4663`). Base Sepolia (`84532`) and Robinhood Chain
Testnet (`46630`) are development/testnet networks and must not be used by production
execution paths.
