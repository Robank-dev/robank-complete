import { db, env } from './env';
import { buveiConfigured } from './buvei';
import { diditEnabled } from './didit';

export type CapabilityState = 'live' | 'needs-configuration' | 'not-available';
export type Capability = { id: string; label: string; state: CapabilityState; detail: string };

/** What ROBANK can actually do right now, derived from real configuration — never from marketing copy. */
export function capabilities(): Capability[] {
  const has = (...names: string[]) => names.every((n) => Boolean(env(n)));
  const c = (id: string, label: string, state: CapabilityState, detail: string): Capability => ({ id, label, state, detail });
  return [
    c('auth', 'Email sign-in & embedded wallet', has('PRIVY_APP_SECRET') && (has('PRIVY_APP_ID') || has('NEXT_PUBLIC_PRIVY_APP_ID')) ? 'live' : 'needs-configuration', 'Privy email OTP with a self-custodial wallet on Robinhood Chain.'),
    c('portfolio', 'Portfolio', 'live', 'On-chain balances on Robinhood Chain: USDG, ETH and Robinhood Stock Tokens.'),
    c('transfers', 'Transfers', 'live', 'Send USDG, ETH and stock tokens on Robinhood Chain, signed in your embedded wallet.'),
    c('borrow', 'Borrow', 'live', 'Borrow USDG from Morpho markets on Robinhood Chain, executed from your wallet.'),
    c('agent', 'AI agent', has('ROBANK_LLM_API_KEY') ? 'live' : 'needs-configuration', 'Answers questions, reads your balance and prepares transfers for you to review.'),
    c('records', 'Updates, jobs & companies', db() ? 'live' : 'needs-configuration', 'Account records stored by ROBANK.'),
    c('kyc', 'Identity verification (Didit)', diditEnabled('kyc') ? 'live' : 'needs-configuration', 'ID document, selfie, liveness and AML screening.'),
    c('kyb', 'Company verification (Didit)', diditEnabled('kyb') ? 'live' : 'needs-configuration', 'Business verification for company accounts.'),
    c('card', 'ROBANK Card', buveiConfigured() ? 'live' : 'needs-configuration', 'Virtual Visa card loaded with USDG on Robinhood Chain, issued by Buvei.'),
    c('x402', 'Agent Market', 'live', 'Pay-per-call AI services, paid in USDG on Robinhood Chain right from the app.'),
    c('cashout', 'Cash out to PayPal', buveiConfigured() ? 'live' : 'needs-configuration', 'USDG to your PayPal account in seven currencies, after a one-time identity check.')
  ];
}

export function capability(id: string) {
  return capabilities().find((item) => item.id === id)!;
}
