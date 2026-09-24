# ROBANK

ROBANK is an agent-first financial operating layer. Current product surfaces: Dashboard, Assets, Send/Receive, Payments, Agent Market, Jobs/Bounties, Cards, Company, Xstocks, On-ramp, ROBANK Agent, API/CLI and Updates.

## Current production direction
- Base Mainnet is the primary supported payment and settlement network.
- Robinhood Chain Mainnet is used for supported Robinhood asset integrations.
- Privy provides email-first authentication and the associated EVM wallet.
- The frontend is Next.js + TypeScript + Tailwind and deploys to Cloudflare through OpenNext.
- Provider-backed capabilities stay provider-dependent until a live integration is verified.
- Loan and Xstocks are coming soon and must not be represented as live execution.

## Security
ROBANK never asks for private keys or seed phrases. Protected APIs verify Privy access tokens before protected operations. Wallet/resource ownership is checked against the authenticated account. State-changing operations use idempotency where supported, and execution results are verified before being reported as successful.

Keep provider/API secrets in deployment secrets or local environment files. Never commit secrets.

## Local development
npm install
npm run install:all
npm run dev

Frontend: http://localhost:3000
Backend: http://localhost:3001

## Production deployment
Frontend deployment is configured in frontend/wrangler.jsonc.
cd frontend
npm run deploy
