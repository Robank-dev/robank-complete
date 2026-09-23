const API_URL = 'https://api.morpho.org/graphql';

async function query(query, variables = {}) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ query, variables })
  });

  const text = await response.text();

  let payload;

  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`Morpho returned invalid JSON: ${response.status}`);
  }

  if (!response.ok) {
    throw new Error(
      payload?.errors?.[0]?.message ||
      `Morpho request failed: ${response.status}`
    );
  }

  if (payload.errors?.length) {
    throw new Error(payload.errors[0].message || 'Morpho GraphQL error');
  }

  return payload.data;
}

export async function listBaseMarkets({ first = 100 } = {}) {
  const safeFirst = Math.min(Math.max(Number(first) || 100, 1), 1000);

  const data = await query(
    `
      query BaseMarkets($first: Int!) {
        markets(
          first: $first
          where: { chainId_in: [8453] }
          orderBy: SupplyAssetsUsd
          orderDirection: Desc
        ) {
          items {
            marketId
            listed
            lltv
            irmAddress
            oracle {
              address
              type
            }
            loanAsset {
              address
              symbol
              decimals
            }
            collateralAsset {
              address
              symbol
              decimals
            }
            state {
              collateralAssets
              collateralAssetsUsd
              borrowAssets
              borrowAssetsUsd
              supplyAssets
              supplyAssetsUsd
              liquidityAssets
              liquidityAssetsUsd
              borrowApy
              supplyApy
              utilization
            }
          }
        }
      }
    `,
    { first: safeFirst }
  );

  return data?.markets?.items || [];
}

export async function getBaseUserPositions(address) {
  if (!address) throw new Error('address is required');

  const data = await query(
    `
      query BaseUserPositions($address: String!) {
        userByAddress(
          address: $address
          chainId: 8453
        ) {
          address
          marketPositions {
            market {
              marketId
              loanAsset {
                address
                symbol
              }
              collateralAsset {
                address
                symbol
              }
            }
            state {
              borrowAssets
              borrowAssetsUsd
              supplyAssets
              supplyAssetsUsd
              collateral
              collateralUsd
            }
          }
        }
      }
    `,
    { address }
  );

  return data?.userByAddress || {
    address,
    marketPositions: []
  };
}