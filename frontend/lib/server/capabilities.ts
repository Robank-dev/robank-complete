import { db, env } from './env';

export type CapabilityState = 'live' | 'needs-configuration' | 'not-available';
export type Capability = { id: string; label: string; state: CapabilityState; detail: string };

/** What ROBANK can actually do right now, derived from real configuration — never from marketing copy. */
export function capabilities(): Capability[] {
  const has = (...names: string[]) => names.every((n) => Boolean(env(n)));
  const c = (id: string, label: string, state: CapabilityState, detail: string): Capability => ({ id, label, state, detail });
  return [
    c('auth', 'Email sign-in & embedded wallets', has('PRIVY_APP_SECRET') && (has('PRIVY_APP_ID') || has('NEXT_PUBLIC_PRIVY_APP_ID')) ? 'live' : 'needs-configuration', 'Privy email OTP with self-custodial EVM and Solana wallets.'),
    c('portfolio', 'Portfolio', 'live', 'On-chain balances for stablecoins, native gas tokens and xStocks across supported networks.'),
    c('transfers', 'Wallet transfers', 'live', 'Same-network transfers on EVM and Solana, signed in your embedded wallet.'),
    c('cross-chain', 'Cross-network transfers', 'live', 'Stablecoin routes quoted and executed through LI.FI.'),
    c('borrow', 'Borrow', 'live', 'Morpho markets on Base and Robinhood Chain, executed from your wallet.'),
    c('agent', 'AI agent', has('ROBANK_LLM_API_KEY') ? 'live' : 'needs-configuration', 'Answers questions, reads your balances and prepares actions for you to review.'),
    c('records', 'Updates, jobs & companies', db() ? 'live' : 'needs-configuration', 'Account records stored by ROBANK.'),
    c('onramp', 'Buy with card or bank (MoonPay)', has('MOONPAY_API_KEY', 'MOONPAY_SECRET_KEY') ? 'live' : 'needs-configuration', 'Card and bank purchases of USDC delivered to your wallet.'),
    c('kyc', 'Identity verification (Didit)', has('DIDIT_API_KEY', 'DIDIT_KYC_WORKFLOW_ID') ? 'live' : 'needs-configuration', 'Personal identity checks required by card and fiat providers.'),
    c('kyb', 'Company verification (Didit)', has('DIDIT_API_KEY', 'DIDIT_KYB_WORKFLOW_ID') ? 'live' : 'needs-configuration', 'Business verification for company accounts.'),
    c('card', 'ROBANK Card', 'not-available', 'Card issuing is not live yet. No card can be ordered or funded today.'),
    c('bank-payout', 'Bank payouts', 'not-available', 'Sending to bank accounts is not live yet.'),
    c('mobile-pay', 'Apple Pay / Google Pay', 'not-available', 'Depends on a live card program.'),
    c('qr-pay', 'QR payments', 'not-available', 'Not live yet.')
  ];
}

export function capability(id: string) {
  return capabilities().find((item) => item.id === id)!;
}
