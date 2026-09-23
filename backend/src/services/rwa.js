import { discoverBaseVaults } from '../integrations/centrifuge/client.js';

function normalizeVault(vault) {
  return {
    provider: 'centrifuge',
    providerId: vault.centrifugeId,
    vaultId: vault.id,
    poolId: vault.poolId,
    shareTokenId: vault.tokenId,
    assetAddress: vault.assetAddress,
    network: 'base',
    active: Boolean(vault.isActive),
    status: vault.status || null,
    eligibility: 'provider-confirmed-required',
    execution: 'provider-confirmed-required'
  };
}

export async function discoverRwa({ limit = 100 } = {}) {
  const vaults = await discoverBaseVaults({ limit });

  return vaults.map(normalizeVault);
}

export async function getRwaDiscovery({ limit = 100 } = {}) {
  const assets = await discoverRwa({ limit });

  return {
    network: 'base',
    provider: 'centrifuge',
    count: assets.length,
    assets
  };
}