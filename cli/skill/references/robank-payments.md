# Payments

## Receiving
The user shares their EVM or Solana address from Receive. The sender must use the same asset **and** network. ROBANK does not credit anything off-chain; a deposit shows up when it is on-chain.

## Sending
1. Choose asset, source network, destination network, recipient and amount.
2. ROBANK checks the amount against the on-chain balance and warns when there is no gas token for fees.
3. The user reviews: amount, recipient, networks, fees (cross-network), estimated time.
4. The user signs in the embedded wallet.
5. ROBANK shows the transaction hash with an explorer link and waits for confirmation. If confirmation cannot be observed in time, the state is **unconfirmed** — check the explorer before retrying.

Same-network transfers are direct ERC-20 / SPL transfers (native tokens are plain transfers). Solana transfers create the recipient's token account if needed (the sender pays a small SOL rent).

Cross-network transfers exist for stablecoins only and use LI.FI. The quote shows the estimated and minimum received amount; quotes expire after ~45 seconds.

## Fees
Network fees are paid in the source network's gas token (ETH, POL, BNB, SOL). LI.FI routes include bridge/relayer fees shown in the review. ROBANK may add an integrator fee only if configured, and it is included in the quote.

## Not available
Bank payouts, card payments, Apple/Google Pay and QR payments.
