# Agent Market and x402

x402 is an HTTP payment standard: a service replies `402 Payment Required` with payment terms, and the client pays (usually USDC) and retries.

ROBANK's Agent Market lists services from x402-list.com that accept payment on Base or Robinhood Chain, with their verification flag, risk assessment, minimum price, networks and uptime, plus claimable bounties from Agent Bounties.

Users pay x402 services per call in USDG on Robinhood Chain from the app: they see the exact price and sign an authorization for exactly that amount (no network fee). The CLI does not pay. Treat services marked high/critical risk as unsafe. Listing on the market is not an endorsement.
