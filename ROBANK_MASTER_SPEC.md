# ROBANK â€” Master Build Prompt for AI Agent

---

## KONTEKS & LATAR BELAKANG

Kita sedang membangun **ROBANK** â€” sebuah on-chain neobank platform yang berjalan di atas Web3 infrastructure tanpa memerlukan lisensi perbankan, approval dari provider kartu kredit/debit, atau badan hukum khusus.

### Kenapa Model Ini

Awalnya kita ingin membangun platform virtual card (Visa/Mastercard) seperti neobank konvensional. Masalahnya:
- Semua provider card issuing (Wallester, Nium, Immersve, Unit.co, dll) membutuhkan approval berbulan-bulan
- Membutuhkan lisensi perbankan atau banking sponsor
- Tidak feasible untuk diluncurkan dalam waktu dekat

**Solusi:** Kita pivot ke model **on-chain non-custodial neobank** â€” dimana Robank menjadi interface/router, bukan bank sesungguhnya. Inspirasi dari Gitbank (gitbank.io) tapi jauh lebih luas dan tidak terbatas untuk developer saja.

---

## VISI ROBANK

**"Your money. Your agent. Your bank."**

Robank adalah platform keuangan digital yang terasa seperti neobank modern, tapi berjalan sepenuhnya di atas blockchain. Setiap user mendapatkan:
- Personal vault (smart contract Safe/Gnosis) yang hanya mereka yang kontrol
- AI Financial Agent pribadi yang bisa memahami perintah natural language
- Kemampuan kirim/terima pembayaran dalam USDC/USDT secara global
- Payment routing otomatis ke rail terbaik (tercepat, termurah)
- Fiat on-ramp (deposit dari kartu/bank ke USDC via MoonPay)
- Dashboard keuangan yang clean dan modern

### Diferensiasi dari Gitbank
| | Gitbank | Robank |
|---|---|---|
| Target user | Developer GitHub | Siapapun (individu & bisnis) |
| Interface | GitHub comment | Web dashboard + Terminal CLI + API |
| AI | Parse command basic | Full AI financial agent (Claude) |
| Chain | Base only | Multi-chain (Base, Arbitrum, Robinhood Chain) |
| Identity | GitHub OAuth | Email / Wallet / DID |
| Use case | Developer bounty | Full neobank experience |
| Currency | USDC, WETH | USDC, USDT, USDG, WETH |

---

## KENAPA TIDAK BUTUH LISENSI / APPROVAL

Robank adalah **non-custodial** â€” artinya:
- Robank TIDAK menyimpan uang user
- Vault = smart contract milik user sendiri (Safe/Gnosis)
- Robank hanya software/interface yang berinteraksi dengan kontrak yang sudah ada
- Semua smart contract yang digunakan adalah milik pihak lain yang sudah teruji (Safe, USDC Circle, Uniswap, x402)
- Robank TIDAK perlu deploy contract sendiri â€” semuanya numpang yang sudah ada

---

## TECH STACK

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Wallet:** wagmi v2 + viem v2 + WalletConnect
- **State:** @tanstack/react-query
- **Language:** TypeScript

### Backend
- **Runtime:** Node.js (ESM)
- **Framework:** Express.js
- **AI:** @anthropic-ai/sdk (Claude Haiku untuk agent, Claude Sonnet untuk analisis)
- **Blockchain:** viem

### Blockchain
- **Primary Chain:** Base L2 (chainId: 8453)
- **Secondary:** Arbitrum, Robinhood Chain (USDG)
- **Vault:** Safe (Gnosis Safe) â€” sudah deployed, tinggal pakai
- **Currency:** USDC (primary), USDT, USDG, WETH
- **Payment:** x402 protocol (Coinbase, open source)
- **Swap:** Uniswap V3 (sudah deployed di Base)

### Hosting
- **Frontend:** Vercel
- **Backend:** Railway
- **Database:** PostgreSQL (Railway)

---

## CONTRACT ADDRESSES (SEMUA NUMPANG, ZERO DEPLOY)

```javascript
// Base Mainnet (chainId: 8453)
USDC:               "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
SAFE_PROXY_FACTORY: "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67"
SAFE_SINGLETON:     "0x41675C099F32341bf84BFc5382aF534df5C7461"
UNISWAP_V3_ROUTER:  "0x2626664c2603336E57B271c5C0b26F421741e481"
WETH:               "0x4200000000000000000000000000000000000006"
// x402 facilitator: cek https://github.com/coinbase/x402 untuk address terbaru

// Base Sepolia Testnet (chainId: 84532) â€” untuk development
USDC:               "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
SAFE_PROXY_FACTORY: "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67"
```

---

## ENVIRONMENT VARIABLES YANG DIPERLUKAN

```env
# Backend
ROBANK_LLM_API_KEY=       # set locally; never commit the real key
BASE_RPC_URL=https://mainnet.base.org
MOONPAY_API_KEY=             # dari moonpay.com/business/onramp
MOONPAY_SECRET_KEY=
DATABASE_URL=                # PostgreSQL connection string
PORT=3001

# Frontend (NEXT_PUBLIC_ prefix wajib)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=   # dari cloud.walletconnect.com
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_CHAIN_ID=8453               # Base Mainnet; Robinhood Chain Mainnet uses chain ID 4663
```

---

## STRUKTUR FOLDER

```
robank/
â”œâ”€â”€ frontend/
â”‚   â”œâ”€â”€ app/
â”‚   â”‚   â”œâ”€â”€ page.tsx                    # Landing page
â”‚   â”‚   â”œâ”€â”€ layout.tsx                  # Root layout + providers
â”‚   â”‚   â”œâ”€â”€ dashboard/
â”‚   â”‚   â”‚   â””â”€â”€ page.tsx                # Main dashboard setelah login
â”‚   â”‚   â”œâ”€â”€ vault/
â”‚   â”‚   â”‚   â””â”€â”€ page.tsx                # Vault detail + balance
â”‚   â”‚   â”œâ”€â”€ send/
â”‚   â”‚   â”‚   â””â”€â”€ page.tsx                # Send USDC
â”‚   â”‚   â”œâ”€â”€ receive/
â”‚   â”‚   â”‚   â””â”€â”€ page.tsx                # Receive / QR code
â”‚   â”‚   â”œâ”€â”€ agent/
â”‚   â”‚   â”‚   â””â”€â”€ page.tsx                # AI Agent terminal interface
â”‚   â”‚   â””â”€â”€ onramp/
â”‚   â”‚       â””â”€â”€ page.tsx                # MoonPay fiat deposit
â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”œâ”€â”€ WalletConnect.tsx           # Connect wallet button
â”‚   â”‚   â”œâ”€â”€ VaultCard.tsx               # Balance display card
â”‚   â”‚   â”œâ”€â”€ TransactionList.tsx         # Tx history
â”‚   â”‚   â”œâ”€â”€ AgentTerminal.tsx           # Terminal UI untuk AI agent
â”‚   â”‚   â”œâ”€â”€ SendForm.tsx                # Send payment form
â”‚   â”‚   â”œâ”€â”€ ReceiveCard.tsx             # Wallet address + QR
â”‚   â”‚   â””â”€â”€ OnrampWidget.tsx            # MoonPay embed
â”‚   â”œâ”€â”€ lib/
â”‚   â”‚   â”œâ”€â”€ wagmi.ts                    # Wagmi config
â”‚   â”‚   â”œâ”€â”€ safe.ts                     # Safe vault functions
â”‚   â”‚   â”œâ”€â”€ usdc.ts                     # USDC read/write
â”‚   â”‚   â””â”€â”€ x402.ts                     # Payment routing
â”‚   â””â”€â”€ providers/
â”‚       â””â”€â”€ Web3Provider.tsx            # WagmiProvider + QueryClientProvider
â”‚
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ routes/
â”‚   â”‚   â”œâ”€â”€ agent.js                    # POST /api/agent/chat
â”‚   â”‚   â”œâ”€â”€ vault.js                    # GET /api/vault/:address/balance
â”‚   â”‚   â”‚                               # GET /api/vault/:address/transactions
â”‚   â”‚   â”œâ”€â”€ payments.js                 # POST /api/payments/route
â”‚   â”‚   â””â”€â”€ users.js                    # POST /api/users/register
â”‚   â”œâ”€â”€ services/
â”‚   â”‚   â”œâ”€â”€ claude.js                   # Anthropic API integration
â”‚   â”‚   â”œâ”€â”€ safe.js                     # Safe on-chain reads
â”‚   â”‚   â”œâ”€â”€ x402.js                     # x402 payment routing
â”‚   â”‚   â””â”€â”€ onramp.js                   # MoonPay API
â”‚   â””â”€â”€ index.js                        # Express entry point
â”‚
â””â”€â”€ contracts/
    â””â”€â”€ addresses.js                    # Semua contract addresses
```

---

## FITUR YANG HARUS DIBANGUN

### 1. Wallet Connection
- Support MetaMask, Coinbase Wallet, WalletConnect
- Setelah connect, Robank predict/deploy Safe vault untuk user
- Tampilkan alamat vault dan USDC balance

### 2. Dashboard
- Total balance dalam USD
- Recent transactions (ambil dari Safe Transaction Service API)
- Quick actions: Send, Receive, Swap, Buy (on-ramp)
- AI Agent shortcut

### 3. Send Payment
- Input: alamat tujuan (address atau ENS) + jumlah USDC
- Preview fee
- Execute via Safe transaction
- Konfirmasi di wallet

### 4. Receive
- Tampilkan vault address
- QR code
- Copy to clipboard

### 5. AI Agent Terminal
- Interface seperti terminal / chat
- User ketik perintah natural language
- AI parse dan execute action
- Contoh commands:
  ```
  send 50 USDC to 0x1234...
  what's my balance
  show my last 5 transactions
  swap 100 USDC to WETH
  pay [address] 25
  ```
- History percakapan disimpan per session

### 6. Fiat On-Ramp
- Embed MoonPay widget
- User bisa deposit dari kartu kredit/transfer bank
- USDC masuk langsung ke vault mereka

### 7. Swap (opsional MVP)
- Swap USDC â†” WETH via Uniswap V3
- Tampilkan quote sebelum execute

---

## AI AGENT â€” SYSTEM PROMPT

```
You are Robank AI â€” a personal financial agent embedded in the Robank platform.
You help users manage their on-chain vault, send/receive USDC payments on Base network,
check balances, and make smart financial decisions.

The user's vault is a Safe smart contract on Base L2.
All transactions use USDC as the primary currency.

You understand commands like:
- "send 50 USDC to 0x..." â†’ parse as send action
- "what's my balance" â†’ fetch balance
- "show my transactions" â†’ fetch tx history
- "swap 100 USDC to WETH" â†’ initiate swap
- "deposit from my bank" â†’ redirect to on-ramp

When you identify a financial action, respond with a JSON object:
{
  "action": "send" | "balance" | "transactions" | "swap" | "onramp" | "info",
  "amount": number | null,
  "token": "USDC" | "WETH" | "USDT" | null,
  "to": "0x..." | null,
  "message": "Human readable explanation of what you're doing"
}

If the user is just asking questions, respond naturally and helpfully.
Keep responses concise and direct. You are efficient, not chatty.
Never expose technical details unless asked.
Always confirm before executing any transaction.
```

---

## REFERENSI & DOKUMENTASI

### Core Libraries
- wagmi: https://wagmi.sh/react/getting-started
- viem: https://viem.sh/docs/getting-started
- Safe SDK: https://docs.safe.global/sdk/protocol-kit
- Safe Transaction Service API: https://safe-transaction-base.safe.global

### Smart Contracts
- Safe docs: https://docs.safe.global/advanced/smart-account-supported-networks/v1.4.1
- USDC on Base: https://developers.circle.com/stablecoins/docs/usdc-on-base
- Uniswap V3 Base: https://docs.uniswap.org/contracts/v3/reference/deployments/base-deployments
- x402 protocol: https://github.com/coinbase/x402

### Infrastructure
- Base chain docs: https://docs.base.org
- Base Sepolia faucet: https://faucet.quicknode.com/base/sepolia
- Base explorer: https://basescan.org
- Safe Transaction Service: https://safe-transaction-base.safe.global/api/v1/

### On-Ramp
- MoonPay: https://dev.moonpay.com/docs/on-ramp-sdk

### Inspiration / Reference Code
- Gitbank CLI: https://github.com/gitbankio/gitbank-cli
- Gitbank SDK: https://github.com/gitbankio/gitbank-sdk
- Gitbank App: https://github.com/gitbankio/app
- Superstables: https://github.com/coinbase/x402 (payment routing)

---

## UI/UX DIRECTION

- **Vibe:** Dark, minimal, techy â€” bukan SaaS biasa. Lebih ke "hacker neobank"
- **Warna:** Dark background (#0A0A0F), accent electric blue atau purple
- **Font:** Monospace untuk angka/address, sans-serif untuk konten
- **Feel:** Mirip Linear.app meets Coinbase Wallet â€” clean tapi powerful
- **NO:** Tidak ada card-card SaaS biasa, tidak ada gradient rainbow, tidak ada template fintech biasa
- **YES:** Terminal-like elements, clean data tables, smooth micro-animations pada aksi user

---

## CARA KERJA VAULT (PENTING DIPAHAMI)

```
1. User connect wallet (MetaMask/Coinbase/WalletConnect)
           â†“
2. Robank cek apakah user sudah punya Safe vault
   â†’ Gunakan Safe Transaction Service API
   â†’ GET https://safe-transaction-base.safe.global/api/v1/owners/{address}/safes/
           â†“
3a. Jika belum ada vault:
    â†’ Tampilkan tombol "Create Your Vault"
    â†’ Call SafeProxyFactory.createProxyWithNonce()
    â†’ User sign transaksi di wallet mereka
    â†’ Vault terdeploy, address disimpan
           â†“
3b. Jika sudah ada vault:
    â†’ Langsung load balance dan transaksi
           â†“
4. Dashboard tampil dengan data vault user
```

---

## API ENDPOINTS YANG HARUS DIBANGUN

```
POST /api/agent/chat
  Body: { message: string, history: array, vaultAddress: string }
  Response: { response: string, action?: object }

GET /api/vault/:address/balance
  Response: { address, balance, token: "USDC" }

GET /api/vault/:address/transactions
  Response: { transactions: array }

POST /api/payments/route
  Body: { from: string, to: string, amount: number, token: string }
  Response: { txData: object, estimatedFee: number }

GET /api/onramp/url
  Query: { walletAddress: string, amount?: number }
  Response: { url: string }
```

---

## BUILD ORDER / PRIORITAS

### Phase 1 â€” MVP (Kerjakan ini dulu)
1. Setup Next.js + Tailwind + wagmi
2. Wallet connection (MetaMask + Coinbase Wallet)
3. Safe vault detection + creation
4. USDC balance display
5. Send USDC form
6. Transaction history
7. Basic AI Agent terminal (text only dulu)

### Phase 2 â€” Core Features
8. MoonPay on-ramp integration
9. Receive page + QR code
10. AI Agent yang bisa execute actions
11. Swap via Uniswap V3

### Phase 3 â€” Polish
12. Multi-chain support (Arbitrum, Robinhood Chain)
13. USDG support (Robinhood Chain)
14. Advanced AI agent features
15. Mobile responsive

---

## CATATAN PENTING UNTUK AGENT

1. **Selalu gunakan Base Sepolia testnet dulu** untuk development, baru mainnet untuk production
2. **Jangan deploy contract sendiri** â€” semua numpang yang sudah ada
3. **Vault = Safe proxy** â€” setiap user punya Safe contract sendiri sebagai vault
4. **USDC di Base punya 6 decimals** â€” selalu divide by 1_000_000 untuk display
5. **Robank tidak pegang private key user** â€” semua signing dilakukan di wallet user
6. **Safe Transaction Service** tersedia gratis di https://safe-transaction-base.safe.global â€” gunakan untuk fetch transaksi tanpa RPC call mahal
7. **x402 protocol** adalah payment standard HTTP 402 â€” cocok untuk agent-to-agent payments
8. **Claude Haiku** untuk AI agent (cepat, murah) â€” model: `claude-haiku-4-5-20251001`

---

## YANG BELUM ADA / PERLU DIAMBIL OWNER

Hal-hal berikut harus diambil sendiri oleh owner (tidak bisa di-hardcode):

1. **ANTHROPIC_API_KEY** â†’ https://console.anthropic.com
2. **WALLETCONNECT_PROJECT_ID** â†’ https://cloud.walletconnect.com
3. **MOONPAY_API_KEY** â†’ https://www.moonpay.com/business/onramp
4. **Domain** â†’ https://namecheap.com (cari robank.io / robank.finance / getrobank.com)
5. **Railway account** â†’ https://railway.app (backend + database hosting)
6. **Vercel account** â†’ https://vercel.com (frontend hosting)
7. **Wallet dengan sedikit ETH di Base** untuk gas testnet â†’ https://faucet.quicknode.com/base/sepolia

