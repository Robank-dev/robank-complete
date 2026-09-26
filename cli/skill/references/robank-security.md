# Security model

- **Self-custody.** Privy embedded wallets; keys are never available to ROBANK servers, agents or the CLI.
- **Every state change is signed by the user** in the web app after a review screen. There is no server-side signing and no autonomous execution.
- **Server-side identity.** APIs verify the Privy access token (or a hashed personal API key) and derive wallets from Privy. Client-supplied addresses are not trusted.
- **Validation.** Chain IDs, token contracts and amounts are checked against ROBANK's verified registry. Cross-network quotes are rejected if the provider's route does not exactly match the request.
- **Records.** Job transitions are atomic; payouts are only marked paid after the stablecoin transfer is verified on-chain, and each transaction can be recorded once.
- **Secrets** (Privy, LLM, MoonPay, Didit, LI.FI keys) live in Cloudflare Worker secrets and never reach the browser. MoonPay URLs are signed server-side and always target the user's own wallet.
- **Rate limits** per account, backed by the database.
- **Agent.** Blocks prompt-injection and secret-extraction requests, never claims execution, and only returns links to review screens.
- **Headers.** HSTS, frame denial, nosniff, strict referrer policy and a restrictive permissions policy.

Users should never share a seed phrase, private key or verification code with anyone, including ROBANK.
