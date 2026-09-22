# ROBANK — On-chain Neobank MVP

ROBANK is an on-chain, non-custodial financial interface. The frontend connects to a user's wallet, creates/loads a Safe vault, reads USDC balances, and provides send/receive/agent/on-ramp surfaces. The backend provides a small Express API for registration, vault helpers, payment routing metadata, and AI agent parsing.

## Current scope

- Base Sepolia first
- Next.js + TypeScript + Tailwind
- wagmi + viem + React Query
- Safe Protocol Kit for predicted Safe/deployment transaction generation
- Express backend
- Optional PostgreSQL persistence
- Optional Anthropic agent integration
- Optional MoonPay on-ramp URL passthrough

## Important

No real private keys are stored by ROBANK. Wallet signatures happen in the connected wallet. Keep all provider/API secrets in `.env` files and never commit them.

The current UI is an MVP scaffold. Productionizing custody, fiat rails, compliance, rate limits, logging, analytics, security reviews, and exact legal/regulatory treatment is separate work.

## PowerShell setup

From the extracted `robank` folder:

```powershell
npm install
npm run install:all
Copy-Item frontend\.env.example frontend\.env.local
Copy-Item backend\.env.example backend\.env
npm run dev
```

Frontend: http://localhost:3000
Backend: http://localhost:3001

## WalletConnect

Set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` if you want the WalletConnect connector enabled. Injected wallets (MetaMask/other browser wallets) work without it.

## Base Sepolia

Use a wallet on Base Sepolia for development. You need test ETH for gas and test USDC for token operations.
