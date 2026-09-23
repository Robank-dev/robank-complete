# ROBANK Payments — Advanced Scenarios

Payments in ROBANK are not limited to peer transfers. These examples reflect the
realistic scope of agent-driven payment operations.

## Example 1 — Paying Multiple Contractors

**USER:** "Pay this month's contractors from the payroll list."

**AGENT:**
1. Read the payroll list / mandate scope
2. Check treasury balance covers total
3. Get quotes for each contractor payment
4. Check mandate allows the destinations/amounts
5. Request approval if any payment exceeds auto-execute threshold
6. Execute approved payments
7. Verify each settlement individually
8. Report per-contractor status (settled / failed / pending)

## Example 2 — Agent Pays for Compute via x402

**USER:** "Let the agent pay for its own inference calls."

**AGENT:**
1. Detect `402 Payment Required` from the compute provider
2. Inspect payment requirement (amount, asset, network)
3. Check x402 spending mandate (per-call cap, approved providers)
4. Pay if within mandate; otherwise request approval
5. Retry the original request
6. Report resource result and payment reference

## Example 3 — Routing a $50,000 Settlement

**USER:** "Route a $50,000 settlement through the best available rail."

**AGENT:**
1. Pull available routes for the amount/asset
2. Compare cost, speed, and capacity across rails
3. Flag this as a high-value transaction (Section 10 of SKILL.md)
4. Present the recommended route and total cost
5. Require explicit approval regardless of mandate breadth
6. Execute only after confirmation
7. Verify settlement and report the transaction reference

## Example 4 — Retry After a Failed Payment

**AGENT (autonomous, post-failure):**
1. Detect payment failure and reason (e.g., route timeout, insufficient liquidity)
2. Check retry policy (max attempts, backoff, alternate-route permission)
3. If policy allows, select an alternate route and retry
4. If retries are exhausted, stop and report the failure — do not fabricate success
5. Log each attempt with its actual outcome

## Example 5 — Scheduled Payroll Distribution

**USER (standing instruction):** "Distribute payroll on the 1st of each month."

**AGENT (on schedule):**
1. Confirm the schedule is still active and within mandate
2. Check treasury liquidity covers total payroll
3. Quote and route each payment
4. Execute within mandate; flag any payment that would breach limits
5. Report full run summary: total paid, per-recipient status, any exceptions

## Example 6 — Multi-Network Payment Routing

**USER:** "Pay this invoice on whichever network is cheapest right now."

**AGENT:**
1. Call `network.list` to see current supported/live networks
2. Get routes across those networks
3. Select lowest-cost viable route within mandate
4. Execute and report which network was actually used

## Example 7 — API Marketplace Auto-Charging an Agent

**Context:** An API marketplace charges the agent per call via x402.

**AGENT:**
1. Inspect the 402 response for cost per call
2. Confirm this provider/resource is within the agent's approved x402 mandate
3. Pay automatically if within per-call and cumulative caps
4. Track cumulative spend against the mandate ceiling
5. Stop and request approval once nearing the cap, rather than exceeding it silently

---

**Rule across all examples:** the agent never reports a payment as "sent," "paid," or
"settled" without an actual execution result confirming it. Partial or failed steps
are reported exactly as they occurred.
