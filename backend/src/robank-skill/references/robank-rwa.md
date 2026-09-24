# ROBANK Tokenized Assets / RWA

## Core Concept

**USER:** "Build me a technology basket."

**AGENT:**
1. Discover supported assets (`rwa.discover`) — provider-dependent results
2. Inspect the provider/venue for each candidate asset (issuance, custody,
   eligibility)
3. Check availability/eligibility for the account (jurisdiction, provider approval,
   etc. — provider-dependent, never assumed)
4. Build the proposed composition
5. Preview the basket (`rwa.preview`) — cost, expected weights, any eligibility
   flags
6. Request user approval before first-time execution
7. Execute (`rwa.execute`) only within mandate and after approval
8. Monitor resulting positions
9. Rebalance the basket as policy/drift requires, following the same
   simulate-then-execute pattern as treasury rebalancing

## Example Composition

The following is an illustrative **underlying-equity reference** only:

```
NVDA   30%
AAPL   25%
MSFT   25%
TSM    20%
```

Those tickers identify public equities in the example. They are **not** evidence that
ROBANK currently holds or can currently execute tokenized versions of those stocks.
Real tokenized compositions must come from actual discovery/preview results, never
invented weights presented as current holdings.

## Current ROBANK Status

**External Stock Token discovery: LIVE.** The current ROBANK web experience can show
traditional public-stock market data separately and can surface provider-issued Stock
Tokens discovered through public catalogs. The ROBANK execution rail for those products
is not currently presented as live. Backend/provider discovery code may exist for future
integrations; discovery does not imply user eligibility, custody, liquidity, issuance,
or execution availability.

## Broader Examples

- "Build me a diversified public-markets basket."
- "Increase my allocation to approved tokenized assets to 35%."
- "Show me available tokenized gold products."
- "Compare approved tokenized asset products by chain, liquidity, and eligibility."
- "Rebalance my approved basket when allocation drifts by more than 5%."

Each of these should follow the same discover → preview → approve → execute →
monitor sequence, with drift-triggered rebalances re-entering that sequence rather
than executing directly.

## Critical Boundaries

- **ROBANK is not automatically the issuer, custodian, or regulator of any tokenized
  asset.** Issuance, custody, eligibility determination, and legal structure can
  remain with external providers/venues.
- Always label RWA capabilities **PROVIDER-DEPENDENT** unless a specific integration
  is confirmed live.
- Never invent:
  - Live RWA integrations that haven't been confirmed
  - Provider approval or eligibility status
  - KYC/compliance approval
  - Asset availability where none has been confirmed by an actual discovery call
- Never bypass a provider's own compliance or eligibility flow — if a provider
  requires additional verification, surface that requirement to the user rather than
  working around it.

## Status Labeling

When discussing RWA capabilities, default to:

- **PROVIDER-DEPENDENT** for anything involving issuance, custody, or eligibility
- **PLANNED** for basket construction/execution flows not yet confirmed live
- Only use **LIVE** when the runtime environment has confirmed a working, current
  integration
