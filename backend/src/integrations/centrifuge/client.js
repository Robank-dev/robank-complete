const API_URL = 'https://api.centrifuge.io';

async function queryCentrifuge(query, variables = {}) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  });

  const text = await response.text();

  let payload;

  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`Centrifuge returned invalid JSON: ${response.status}`);
  }

  if (!response.ok) {
    throw new Error(
      payload?.errors?.[0]?.message ||
      `Centrifuge request failed: ${response.status}`
    );
  }

  if (payload.errors?.length) {
    throw new Error(payload.errors[0].message || 'Centrifuge GraphQL error');
  }

  return payload.data;
}

export async function discoverBaseVaults({ limit = 100 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 1000);

  const query = `
    query DiscoverVaults($limit: Int!) {
      vaults(limit: $limit) {
        items {
          id
          centrifugeId
          poolId
          tokenId
          assetAddress
          isActive
          status
          blockchain {
            centrifugeId
            name
          }
        }
      }
    }
  `;

  const data = await queryCentrifuge(query, { limit: safeLimit });

  return (data?.vaults?.items || []).filter(
    (vault) => String(vault.blockchain?.name || '').toLowerCase() === 'base'
  );
}

export async function getBaseVaults({ limit = 100 } = {}) {
  return discoverBaseVaults({ limit });
}