// Robinhood Stock Tokens: ERC-20s on Robinhood Chain issued by Robinhood. Each token tracks
// `multiplier` shares of the underlying (corporate actions change it), so value = price × multiplier.

export type RobinhoodToken = { symbol: string; name: string; logo: string | null; contract: string; multiplier: number };

let memory: { at: number; tokens: RobinhoodToken[] } = { at: 0, tokens: [] };
let inflight: Promise<RobinhoodToken[]> | null = null;
const TTL_MS = 15 * 60_000;

async function load(): Promise<RobinhoodToken[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch('https://api.robinhood.com/rhj/assets', { signal: controller.signal, headers: { Accept: 'application/json', 'User-Agent': 'ROBANK/1.0' } });
    if (!response.ok) throw new Error(`Robinhood assets returned ${response.status}`);
    const body = await response.json() as any;
    const tokens: RobinhoodToken[] = [];
    for (const asset of Array.isArray(body?.assets) ? body.assets : []) {
      if (asset?.status !== 'ASSET_STATUS_ACTIVE') continue;
      const deployment = (asset.deployments || []).find((d: any) => Number(d?.chainId) === 4663);
      const contract = String(deployment?.contractAddress || '');
      const symbol = String(asset.tokenSymbol || '').toUpperCase();
      const multiplier = Number(asset.currentMultiplier ?? 1);
      if (!/^0x[a-fA-F0-9]{40}$/.test(contract) || !/^[A-Z0-9.\-]{1,12}$/.test(symbol) || !Number.isFinite(multiplier) || multiplier <= 0) continue;
      tokens.push({
        symbol,
        name: String(asset.tokenName || symbol).replace(/\s*•\s*Robinhood Token$/i, '').slice(0, 120),
        logo: typeof asset.logoUrl === 'string' && asset.logoUrl.startsWith('https://') ? asset.logoUrl : null,
        contract,
        multiplier
      });
    }
    if (!tokens.length) throw new Error('Robinhood catalog empty');
    return tokens;
  } finally {
    clearTimeout(timer);
  }
}

export async function getRobinhoodTokens(): Promise<RobinhoodToken[]> {
  if (memory.tokens.length && Date.now() - memory.at < TTL_MS) return memory.tokens;
  if (inflight) return inflight;
  inflight = load()
    .then((tokens) => { memory = { at: Date.now(), tokens }; return tokens; })
    .catch((error) => { if (memory.tokens.length) return memory.tokens; throw error; })
    .finally(() => { inflight = null; });
  return inflight;
}
