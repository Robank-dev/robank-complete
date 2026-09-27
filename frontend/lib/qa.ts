'use client';

// Local screenshot/QA mode. Enabled only when the server passes qa=true (ROBANK_QA=1 in local .dev.vars).
let enabled = false;
export const setQa = (value: boolean) => { enabled = value; };
export const isQa = () => enabled;

export const QA_ACCOUNT = {
  email: 'preview@robank.co',
  evmAddress: '0x7a91c0b3e5d24f8a9b1c2d3e4f5a6b7c8d9ef21c'
};

const now = () => new Date().toISOString();
const h = (id: string, kind: string, symbol: string, name: string, logo: string, chainId: number, network: string, quantity: string, priceUsd: number | null, decimals = 6) => ({
  id, kind, symbol, name, logo, chainId, network, contract: kind === 'native' ? null : id, decimals,
  raw: BigInt(Math.round(Number(quantity) * 10 ** Math.min(decimals, 8))).toString() + '0'.repeat(Math.max(0, decimals - 8)),
  quantity, priceUsd, valueUsd: priceUsd == null ? null : Number(quantity) * priceUsd, priceSource: null
});

export function qaFixture(path: string): unknown {
  if (path.startsWith('/api/portfolio')) {
    const holdings = [
      h('4663:usdg', 'stablecoin', 'USDG', 'Global Dollar', '/token-icons/usdg.png', 4663, 'Robinhood Chain', '1840.25', 1),
      h('4663:tsla', 'stock-token', 'TSLA', 'Tesla Stock Token', '/chain-icons/robinhood.svg', 4663, 'Robinhood Chain', '1.25', 342.1, 18),
      h('4663:eth', 'native', 'ETH', 'Ether', '/token-icons/eth.png', 4663, 'Robinhood Chain', '0.1842', 2683.4, 18)
    ];
    return { generatedAt: now(), holdings, sources: [{ id: 'evm:4663', label: 'Robinhood Chain', ok: true }], complete: true, totalUsd: holdings.reduce((s, x) => s + (x.valueUsd || 0), 0), unpricedCount: 0, wallets: { evm: QA_ACCOUNT.evmAddress } };
  }
  if (path.startsWith('/api/card') && typeof window !== 'undefined' && location.search.includes('stage=apply')) return { enabled: true, stage: 'apply', applicationPaid: false, identity: { status: 'approved', url: null }, options: { occupations: ['PRIVATE_BUSINESS_EMPLOYEES', 'FREELANCER', 'STUDENTS'], sources: ['SALARY_OR_EMPLOYMENT_INCOME', 'BUSINESS_PROFITS'] }, prefill: { name: 'Alex Morgan', birthDate: '1994-03-12', nationality: 'ID', idType: 'ID_CARD', gender: 'MALE', idExpiryDate: '', country: 'ID', state: 'DKI Jakarta', city: 'Jakarta Selatan', street: 'Jl. Sudirman 12', postalCode: '12190' }, kycAttemptsLeft: 2, fees: { applicationUsd: 5.5, loadPercent: 4, loadFlatUsd: 0.5 }, payment: { chainId: 4663, asset: 'USDG', address: '0x1111111111111111111111111111111111111111', minIssueUsd: 5, minFundUsd: 5 }, card: null };
  if (path.startsWith('/api/card')) return { enabled: true, stage: 'issued', applicationPaid: true, fees: { applicationUsd: 5.5, loadPercent: 4, loadFlatUsd: 0.5 }, payment: { chainId: 4663, asset: 'USDG', address: '0x1111111111111111111111111111111111111111', minIssueUsd: 10, minFundUsd: 5 }, card: { cardId: 'cid_1', status: 'ENABLE', cardNumber: '555543******4821', brand: 'VISA', cardholderName: 'ALEX MORGAN', availableBalance: 212.4, totalConsumption: 87.6 }, transactions: [{ id: 't1', description: 'OpenAI', amount: 20, currency: 'USD', status: 'COMPLETE', at: Date.now() - 3600e3 }, { id: 't2', description: 'Figma', amount: 15, currency: 'USD', status: 'COMPLETE', at: Date.now() - 86400e3 }] };
  if (path.startsWith('/api/jobs')) return { canPost: true, jobs: [{ id: 'j1', title: 'Design three onboarding illustrations', description: 'Three monochrome illustrations for the ROBANK onboarding flow. Deliver SVG files.', rewardAmount: '120', rewardAsset: 'USDG', rewardChainId: 4663, status: 'open', creatorWallet: '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be', workerWallet: null, submission: null, payoutTxHash: null, dueAt: null, createdAt: now(), updatedAt: now(), role: null }] };
  if (path.startsWith('/api/companies')) return { companies: [{ id: 'c1', legalName: 'Robank Labs Inc.', registrationNumber: '7720451', countryCode: 'US', jurisdictionCode: null, status: 'verified', verificationStatus: 'approved', verificationUrl: null, createdAt: now(), entityType: 'corporation', incorporationDate: '2024-03-01', taxId: null, website: 'https://robank.co', industry: 'Financial services', addressLine: null, city: 'Wilmington', postalCode: null, contactEmail: null, verifiedAt: now() }] };
  if (path.startsWith('/api/kyc')) return { enabled: true, status: 'approved', url: null, updatedAt: now() };
  if (path.startsWith('/api/keys')) return { keys: [{ id: 'k1', name: 'MacBook', prefix: 'rbk_4Fq2aZ', createdAt: now(), lastUsedAt: now() }] };
  if (path.startsWith('/api/updates')) return { updates: [{ id: 'u1', title: 'ROBANK is now Robinhood Chain only', body: 'Deposits, balances, transfers, borrowing and the card now all run on Robinhood Chain.', xUrl: null, imageUrl: null, publishedAt: now() }], canPublish: false };
  if (path.startsWith('/api/agent/chat')) return { response: 'Your transfer is ready. Check the details below and press **Send** — nothing moves until you confirm.', action: { type: 'prepare-transfer', path: '/send?asset=USDG&to=0x9f0000000000000000000000000000000000a1&amount=250', label: 'Open in Send', summary: { asset: 'USDG', amount: '250', chainId: 4663, to: '0x9f0000000000000000000000000000000000a1' } } };
  if (path.startsWith('/api/cashout')) return path.includes('rate') ? { rate: 0.99 } : { enabled: true, kycApproved: true, currencies: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'MXN'], fees: { percent: 2, minUsd: 1, minUsdAmount: 5, maxUsdAmount: 5000 }, payment: { chainId: 4663, asset: 'USDG', address: '0x1111111111111111111111111111111111111111' }, cashouts: [{ id: '0xabc', usd: 120, fee: 2.4, currency: 'EUR', arrive: 103.2, paypal: 'alex@example.com', status: 'SUCCESS', at: new Date(Date.now() - 86400e3).toISOString() }] };
  if (path.startsWith('/api/kyc')) return { enabled: true, status: 'approved', url: null, updatedAt: null };
  if (path.startsWith('/api/history')) return { items: [
    { hash: '0x' + '1'.repeat(64), direction: 'in', asset: 'USDG', amount: 500, contract: null, counterparty: '0x3b10000000000000000000000000000000004c2d', at: new Date(Date.now() - 3600e3).toISOString(), block: 3 },
    { hash: '0x' + '2'.repeat(64), direction: 'out', asset: 'USDG', amount: 25, contract: null, counterparty: '0x9f0000000000000000000000000000000000a1', at: new Date(Date.now() - 86400e3).toISOString(), block: 2 },
    { hash: '0x' + '3'.repeat(64), direction: 'in', asset: 'ETH', amount: 0.05, contract: null, counterparty: '0x5500000000000000000000000000000000000e7f', at: new Date(Date.now() - 3 * 86400e3).toISOString(), block: 1 }
  ] };
  return null;
}
