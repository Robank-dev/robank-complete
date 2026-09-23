import { ProviderAdapter } from './adapter.js';

const providers = [
  new ProviderAdapter({
    id: 'buvei',
    name: 'Buvei',
    category: 'card',
    status: 'provider-dependent',
    capabilities: [
      'card.issue',
      'card.manage',
      'card.freeze',
      'card.unfreeze',
      'card.fund',
      'card.transactions',
      'wallet.fund',
      'wallet.withdraw',
      'payout',
      'kyc'
    ]
  }),
  new ProviderAdapter({
    id: 'morpho',
    name: 'Morpho',
    category: 'lending',
    network: 'base',
    status: 'provider-dependent',
    capabilities: [
      'credit.markets',
      'credit.positions',
      'borrow',
      'repay',
      'collateral',
      'risk'
    ]
  }),
  new ProviderAdapter({
    id: 'centrifuge',
    name: 'Centrifuge',
    category: 'rwa',
    network: 'base',
    status: 'provider-dependent',
    capabilities: [
      'rwa.discover',
      'rwa.positions',
      'rwa.deposit',
      'rwa.redeem'
    ]
  }),
  new ProviderAdapter({
    id: 'robinhood-chain',
    name: 'Robinhood Chain',
    category: 'tokenized-assets',
    network: 'robinhood',
    status: 'provider-dependent',
    capabilities: [
      'stocks.discover',
      'stocks.price',
      'stocks.positions',
      'stocks.corporate-actions'
    ]
  }),
  new ProviderAdapter({
    id: 'base',
    name: 'Base',
    category: 'network',
    network: 'base',
    status: 'provider-dependent',
    capabilities: [
      'payments',
      'usdc',
      'swaps',
      'x402',
      'lending',
      'rwa'
    ]
  })
];

export function getProvider(id) {
  return providers.find((provider) => provider.id === id) || null;
}

export function listProviders() {
  return providers.map((provider) => ({
    id: provider.id,
    name: provider.name,
    category: provider.category,
    network: provider.network,
    status: provider.status,
    capabilities: [...provider.capabilities]
  }));
}

export function findProvidersByCapability(capability) {
  return providers
    .filter((provider) => provider.supports(capability))
    .map((provider) => ({
      id: provider.id,
      name: provider.name,
      category: provider.category,
      network: provider.network,
      status: provider.status
    }));
}