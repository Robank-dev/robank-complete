# ROBANK Agent Tool Contract

This defines the conceptual tool layer an agent uses to operate ROBANK. Actual
availability depends on the runtime/integration — treat each as PLANNED unless the
environment confirms it is wired to a live backend.

## wallet.balance
- **Does:** Returns current balances for the connected account
- **Inputs:** account id (implicit from session)
- **Output:** per-asset balances, as-of timestamp
- **Permission:** read-only
- **Confirmation:** never required

## wallet.transactions
- **Does:** Returns transaction history
- **Inputs:** account id, optional filters (date range, asset, status)
- **Output:** list of transactions with status
- **Permission:** read-only
- **Confirmation:** never required

## wallet.send
- **Does:** Sends an asset to a destination address
- **Inputs:** destination, asset, amount, network
- **Output:** submitted transaction reference or error
- **Permission:** execution
- **Confirmation:** required unless within an explicit auto-execute mandate

## wallet.receive
- **Does:** Returns receiving address/instructions for an asset/network
- **Inputs:** asset, network
- **Output:** address/QR/instructions
- **Permission:** read-only
- **Confirmation:** never required

## payments.quote
- **Does:** Produces a quote for a payment (fees, rate, estimated settlement)
- **Inputs:** destination, asset, amount, optional network preference
- **Output:** quote object with expiry
- **Permission:** read-only
- **Confirmation:** never required

## payments.route
- **Does:** Compares available rails/networks for a payment
- **Inputs:** destination, asset, amount
- **Output:** ranked list of routes (cost, speed, availability)
- **Permission:** read-only
- **Confirmation:** never required

## payments.execute
- **Does:** Executes a previously quoted/routed payment
- **Inputs:** payment id or full payment spec, selected route
- **Output:** execution result (success/failure, reference)
- **Permission:** execution
- **Confirmation:** required above mandate threshold or for new destinations

## swap.quote
- **Does:** Quotes a swap between two assets
- **Inputs:** asset in, asset out, amount, network
- **Output:** quote with rate, slippage, expiry
- **Permission:** read-only
- **Confirmation:** never required

## swap.execute
- **Does:** Executes a previously quoted swap
- **Inputs:** quote id or full swap spec
- **Output:** execution result
- **Permission:** execution
- **Confirmation:** required above mandate threshold

## treasury.status
- **Does:** Returns current treasury balances, allocation, and policy state
- **Inputs:** treasury/account id
- **Output:** current allocation vs. target, drift
- **Permission:** read-only
- **Confirmation:** never required

## treasury.simulate
- **Does:** Simulates a rebalance against policy without executing
- **Inputs:** treasury id, optional override parameters
- **Output:** projected post-rebalance allocation and required trades
- **Permission:** read-only
- **Confirmation:** never required

## treasury.rebalance
- **Does:** Executes a rebalance to bring allocation toward target
- **Inputs:** treasury id, simulation id (recommended) or direct parameters
- **Output:** execution result per trade
- **Permission:** execution
- **Confirmation:** required if any resulting position breaches a configured max, or
  if no prior simulation was shown to the user

## agent.mandate
- **Does:** Creates or updates a spending/action mandate for the agent
- **Inputs:** scope (assets, destinations, networks), limits, expiration
- **Output:** mandate object
- **Permission:** account-owner action (not typically agent-initiated)
- **Confirmation:** always required — this is a permission grant

## agent.permissions
- **Does:** Returns the agent's current permission set
- **Inputs:** agent/session id
- **Output:** current mandate detail
- **Permission:** read-only
- **Confirmation:** never required

## agent.revoke
- **Does:** Revokes some or all of an agent's mandate
- **Inputs:** mandate id or scope to revoke
- **Output:** confirmation of revocation
- **Permission:** account-owner action
- **Confirmation:** always required

## x402.inspect
- **Does:** Inspects a `402 Payment Required` response to determine cost/terms
- **Inputs:** the 402 response/resource URL
- **Output:** required payment amount, asset, network, recipient
- **Permission:** read-only
- **Confirmation:** never required

## x402.pay
- **Does:** Pays a x402 payment requirement and retries the original request
- **Inputs:** x402 payment requirement, mandate context
- **Output:** payment result + retried resource response
- **Permission:** execution
- **Confirmation:** required unless within an explicit machine-payment mandate
  (e.g., per-call cap, approved resource/provider list)

## Market data vs tokenized assets

The agent must distinguish read-only public-market data from tokenized products.

- Public stock market data such as **AAPL, NVDA, GOOGL, MSFT and AMZN** is a market-data
  surface and should be labeled **public equity** / **stock**.
- Tokenized stock products belong to the RWA/tokenized-asset surface and must be labeled
  separately. A tokenized product is not interchangeable with its underlying ticker.
- The current web market-data path does not provide stock brokerage order execution.
  Do not turn a price lookup into a claim that a stock order was submitted or filled.

## rwa.discover
- **Does:** Lists available tokenized asset products (provider-dependent; currently treated as a future/coming-soon ROBANK product surface)
- **Inputs:** category/filter (e.g. "technology basket")
- **Output:** list of assets/products with provider/venue metadata
- **Permission:** read-only
- **Confirmation:** never required

## rwa.preview
- **Does:** Previews a basket/position construction without executing
- **Inputs:** target composition
- **Output:** projected basket, costs, eligibility notes
- **Permission:** read-only
- **Confirmation:** never required

## rwa.execute
- **Does:** Executes a previewed basket/position
- **Inputs:** preview id or full composition spec
- **Output:** execution result per asset (provider-dependent)
- **Permission:** execution
- **Confirmation:** always required for first-time execution of a basket

## network.list
- **Does:** Lists supported/planned networks and their status
- **Inputs:** none
- **Output:** list of networks with status label
- **Permission:** read-only
- **Confirmation:** never required
