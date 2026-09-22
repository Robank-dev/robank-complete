# ROBANK + x402

## What x402 Is

x402 is a protocol that lets an HTTP resource respond `402 Payment Required` and lets
the requesting agent pay for that resource programmatically, then retry the request.
It enables autonomous machine-to-machine payments without a human clicking "pay" for
every call.

## Core Flow

```
Agent
  |
  | HTTP request
  v
Resource server
  |
  | 402 Payment Required (amount, asset, network, recipient)
  v
Agent inspects requirement
  |
  | ROBANK payment (within x402 mandate)
  v
Payment settles
  |
  | Original request retried with payment proof
  v
Resource returned
```

## Realistic Use Cases

- Paid APIs (data feeds, enrichment services)
- Premium data access
- Compute / GPU time
- AI inference endpoints
- Agent-to-agent services (one agent paying another for a task or a result)
- Autonomous machine payments in a pipeline with no human in the loop per-call

## Handling x402 in ROBANK

1. **Inspect** — read the 402 response fully: amount, asset, network, recipient,
   any resource-specific terms
2. **Check mandate** — confirm the provider/resource is approved and the amount is
   within per-call and cumulative x402 spending limits
3. **Approve if needed** — if outside mandate, do not pay automatically; ask the user
4. **Pay** — execute the payment through the appropriate rail
5. **Retry** — resubmit the original request with proof of payment
6. **Verify** — confirm the resource was actually returned before reporting success
7. **Report** — log the payment and resource outcome, including failures

## Mandate Considerations Specific to x402

Because x402 payments can happen at high frequency with no per-call human approval,
mandates for x402 should typically define:

- Per-call maximum
- Cumulative cap over a time window
- Approved provider/resource list (or explicit "any provider" opt-in)
- Alerting/reporting threshold (e.g., notify user after $X cumulative spend)

## What Not to Do

- Do not fabricate a live ROBANK x402 endpoint or provider integration
- Do not treat x402 payments as exempt from mandate/approval rules because they are
  "just API calls" — they are real financial transactions
- Do not report a resource as retrieved unless the retried request actually
  succeeded

**Status:** the x402 flow described here is the designed integration pattern.
Specific provider integrations are **PROVIDER-DEPENDENT / PLANNED** unless confirmed
live in the runtime environment.
