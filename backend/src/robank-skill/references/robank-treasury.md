# ROBANK Treasury

Treasury is one of ROBANK's core capabilities: managing an account's holdings against
a written policy, with simulation before execution.

## Financial Mandate Example

**Treasury Policy**

```
Liquidity reserve:         $10,000 USDC
Target allocation:         40% USDC
                            30% ETH
                            30% approved tokenized assets
Maximum per asset:         20% (excluding reserve)
Rebalance cadence:         Monthly
Automatic execution:       Allowed within mandate
Large transactions:        Require approval
```

This is the structure the agent should expect when a user describes treasury rules in
natural language — map their instructions onto these fields explicitly rather than
guessing at unstated ones.

## Natural-Language Examples and Their Mapping

| User says | Maps to |
|---|---|
| "Keep $10,000 liquid and rebalance the rest." | `reserve = 10000 USDC`, rebalance remainder to target allocation |
| "Maintain 40% stablecoins and 30% ETH." | `target_allocation.USDC = 0.40`, `target_allocation.ETH = 0.30` |
| "Rebalance every month." | `rebalance_cadence = monthly` |
| "Don't let any single asset exceed 20%." | `max_per_asset = 0.20` |
| "Show me what it would look like before executing." | Run `treasury.simulate`, do not call `treasury.rebalance` yet |

## Operating Sequence

1. **Policy** — confirm or read the current policy (`treasury.status`)
2. **Limits** — check reserve, target allocation, and max-per-asset constraints
3. **Simulation** — always run `treasury.simulate` before a rebalance unless an
   explicit unattended-execution mandate exists
4. **Execution** — call `treasury.rebalance`, ideally referencing the simulation id,
   only within mandate limits
5. **Verification** — confirm each resulting trade actually settled before reporting
   the new allocation as final
6. **Revocation** — if the user revokes or narrows the treasury mandate, stop any
   pending automated rebalance and confirm the new boundaries before proceeding

## When Approval Is Required

- Any rebalance that would push an asset above its configured max
- Any change to the policy itself (reserve, target allocation, cadence, max-per-asset)
- The first execution of a new or modified policy
- Any rebalance involving tokenized assets where eligibility/provider status is
  unconfirmed

## Reporting

After execution, report:
- The allocation before and after
- Each trade's actual status (settled/failed/pending)
- Any deviation from the simulation (e.g., slippage, a trade that didn't fill)

Never present a post-rebalance allocation as final until every constituent trade is
confirmed settled.
