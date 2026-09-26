import { NextResponse } from 'next/server';
import { decodeFunctionResult, formatUnits, parseAbi, type Address } from 'viem';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MORPHO_API = 'https://api.morpho.org/v1/blue/markets';
const MORPHO_BLUE: Record<number, Address> = {
  8453: '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb',
  4663: '0x9D53d5E3bd5E8d4Cbfa6DB1ca238AEA02E651010'
};

const NETWORKS = [
  { id: 8453, key: 'base', name: 'Base', type: 'evm', provider: 'Morpho', rpc: 'https://mainnet.base.org', appUrl: 'https://app.morpho.org/?network=base' },
  { id: 4663, key: 'robinhood', name: 'Robinhood Chain', type: 'evm', provider: 'Morpho', rpc: 'https://rpc.mainnet.chain.robinhood.com', appUrl: 'https://app.morpho.org/?network=robinhood' },
  { id: 1151111081099710, key: 'solana', name: 'Solana', type: 'solana', provider: 'Kamino', rpc: '', appUrl: 'https://app.kamino.finance/' }
] as const;

const LOAN_SYMBOLS = new Set(['USDC', 'USDT', 'USDG']);
const ERC20_ABI = parseAbi([
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function decimals() view returns (uint8)'
]);

async function json(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      'User-Agent': 'ROBANK/1.0',
      ...(init?.headers || {})
    },
    cache: 'no-store'
  });
  const text = await response.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch {}
  if (!response.ok) throw new Error(body?.message || body?.error || 'Provider request failed');
  return body;
}

async function tokenMeta(chainId: number, token: string) {
  const network = NETWORKS.find((item) => item.id === chainId);
  if (!network?.rpc) return { symbol: 'Collateral', name: 'Collateral', decimals: 18 };
  try {
    const calls = [
      { method: 'symbol', data: '0x95d89b41' },
      { method: 'name', data: '0x06fdde03' },
      { method: 'decimals', data: '0x313ce567' }
    ];
    const results = await Promise.all(calls.map((call) =>
      json(network.rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [{ to: token, data: call.data }, 'latest']
        })
      })
    ));
    const symbol = decodeFunctionResult({
      abi: ERC20_ABI,
      functionName: 'symbol',
      data: String(results[0]?.result || '0x') as `0x${string}`
    });
    const name = decodeFunctionResult({
      abi: ERC20_ABI,
      functionName: 'name',
      data: String(results[1]?.result || '0x') as `0x${string}`
    });
    const decimals = decodeFunctionResult({
      abi: ERC20_ABI,
      functionName: 'decimals',
      data: String(results[2]?.result || '0x') as `0x${string}`
    });
    return { symbol: String(symbol), name: String(name), decimals: Number(decimals) };
  } catch {
    return { symbol: 'Collateral', name: 'Collateral', decimals: 18 };
  }
}

async function marketState(chainId: number, marketId: string) {
  try {
    const body = await json(`https://api.morpho.org/v0/blue/markets/${chainId}:${marketId}/state`);
    return body?.data || null;
  } catch { return null; }
}

async function marketApy(chainId: number, marketId: string) {
  try {
    const body = await json(`https://api.morpho.org/v0/blue/markets/${chainId}:${marketId}/apy-averages`);
    return body?.data || null;
  } catch { return null; }
}

async function marketLiquidity(chainId: number, marketId: string) {
  try {
    const body = await json(`https://api.morpho.org/v0/blue/markets/${chainId}:${marketId}/liquidity`);
    return body?.data || null;
  } catch { return null; }
}

async function buildNetwork(network: (typeof NETWORKS)[number]) {
  if (network.type === 'solana') {
    return {
      ...network,
      morphoAddress: null,
      markets: [],
      notice: 'Solana borrowing is available through Kamino. ROBANK uses provider handoff here until a native Solana transaction adapter is enabled.'
    };
  }

  try {
    const body = await json(`${MORPHO_API}?chain_id=${network.id}&listed=true&limit=100`);
    const candidates = (body?.data || [])
      .filter((market: any) => LOAN_SYMBOLS.has(String(
        market.loan_token_symbol || market.loanToken?.symbol || ''
      ).toUpperCase()) || ['USDC', 'USDT', 'USDG'].includes(
        String(market.loan_token || '').toLowerCase() === '0x833589fcd6edb6e08f4c7c32d4f71b54bdA02913'.toLowerCase()
          ? 'USDC'
          : String(market.loan_token || '').toLowerCase() === '0xfde4c96c8593536e31f229ea8f37b2ad2699bb2'.toLowerCase()
          ? 'USDT'
          : String(market.loan_token || '').toLowerCase() === '0x5fc5360d0400a0fd4f2af552add042d716f1d168'.toLowerCase()
          ? 'USDG'
          : ''
      ))
      .slice(0, 24);

    const enriched = await Promise.all(candidates.map(async (market: any) => {
      const loanToken = String(market.loan_token || '');
      const collateralToken = String(market.collateral_token || '');
      const [collateral, state, apy, liquidity] = await Promise.all([
        tokenMeta(network.id, collateralToken),
        marketState(network.id, market.market_id),
        marketApy(network.id, market.market_id),
        marketLiquidity(network.id, market.market_id)
      ]);

      const loanSymbol = String(
        market.loan_token_symbol ||
        (loanToken.toLowerCase() === '0x833589fcd6edb6e08f4c7c32d4f71b54bdA02913'.toLowerCase() ? 'USDC' :
         loanToken.toLowerCase() === '0xfde4c96c8593536e31f229ea8f37b2ad2699bb2'.toLowerCase() ? 'USDT' :
         loanToken.toLowerCase() === '0x5fc5360d0400a0fd4f2af552add042d716f1d168'.toLowerCase() ? 'USDG' : 'Loan')
      ).toUpperCase();

      const decimals = 6;
      const supplied = state ? Number(formatUnits(BigInt(state.total_supply_assets || '0'), decimals)) : null;
      const borrowed = state ? Number(formatUnits(BigInt(state.total_borrow_assets || '0'), decimals)) : null;
      const liquidityAssets = liquidity ? Number(formatUnits(BigInt(liquidity.market_liquidity || '0'), decimals)) : null;

      return {
        chainId: network.id,
        network: network.name,
        provider: network.provider,
        morphoAddress: MORPHO_BLUE[network.id],
        marketId: String(market.market_id),
        params: {
          loanToken,
          collateralToken,
          oracle: String(market.oracle_address || ''),
          irm: String(market.irm_address || ''),
          lltv: String(market.lltv_wad || '0')
        },
        loanAsset: loanSymbol,
        collateralAsset: collateral.symbol,
        collateralName: collateral.name,
        collateralDecimals: collateral.decimals,
        lltv: Number(market.lltv_wad || 0) / 1e16,
        supplied,
        borrowed,
        liquidity: liquidityAssets,
        borrowApy: apy?.borrow_apy_averages?.['24h'] != null ? Number(apy.borrow_apy_averages['24h']) * 100 : null,
        supplyApy: apy?.supply_apy_averages?.['24h'] != null ? Number(apy.supply_apy_averages['24h']) * 100 : null,
        url: network.appUrl
      };
    }));


    return {
      ...network,
      morphoAddress: MORPHO_BLUE[network.id],
      markets: enriched
        .sort((a, b) => (b.liquidity ?? -1) - (a.liquidity ?? -1))
        .slice(0, 18)
    };
  } catch (error) {
    return { ...network, morphoAddress: MORPHO_BLUE[network.id], markets: [], error: error instanceof Error ? error.message : 'Market discovery failed' };
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const positionMode = url.searchParams.get('position') === '1';
  const chainId = Number(url.searchParams.get('chainId') || 0);
  const marketId = url.searchParams.get('marketId') || '';
  const address = url.searchParams.get('address') || '';
  const collateralDecimals = Math.max(0, Math.min(30, Number(url.searchParams.get('decimals') || 18)));

  if (positionMode) {
    if (!Number.isFinite(chainId) || !marketId || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ position: { collateral: 0, borrow: 0 } }, { status: 200 });
    }
    try {
      const [positionBody, stateBody] = await Promise.all([
        json(`https://api.morpho.org/v0/blue/markets/${chainId}:${marketId}/users/${address}/position`),
        json(`https://api.morpho.org/v0/blue/markets/${chainId}:${marketId}/state`)
      ]);
      const data = positionBody?.data || {};
      const state = stateBody?.data || {};
      const borrowShares = BigInt(data.borrow_shares || '0');
      const totalBorrowAssets = BigInt(state.total_borrow_assets || '0');
      const totalBorrowShares = BigInt(state.total_borrow_shares || '0');
      // Morpho accounts debt in shares. Convert those shares to current loan assets.
      const borrowAssets = totalBorrowShares > BigInt(0)
        ? Number((borrowShares * totalBorrowAssets) / totalBorrowShares)
        : 0;
      const collateralRaw = BigInt(data.collateral_assets || data.collateral || '0');
      const collateralAssets = Number(formatUnits(collateralRaw, collateralDecimals));
      return NextResponse.json({
        position: {
          collateral: collateralAssets,
          borrow: borrowAssets / 1e6
        }
      }, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
    } catch {
      return NextResponse.json({ position: { collateral: 0, borrow: 0 } }, { status: 200 });
    }
  }

  const networksParam = url.searchParams.get('networks');
  const selected = networksParam ? new Set(networksParam.split(',').map(Number)) : null;

  const networks = await Promise.all(
    NETWORKS.filter((network) => !selected || selected.has(network.id)).map(buildNetwork)
  );

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    networks
  }, {
    headers: { 'Cache-Control': 'private, no-store, max-age=0' }
  });
}
