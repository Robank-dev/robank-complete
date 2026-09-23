const API_URL = 'https://api.xstocks.fi/api/v2';

async function request(path) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Accept: 'application/json'
    }
  });

  const text = await response.text();

  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`xStocks returned invalid JSON: ${response.status}`);
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      `xStocks request failed: ${response.status}`
    );
  }

  return data;
}

export async function listBaseOracles({ page = 0, pageSize = 100 } = {}) {
  const safePage = Math.max(Number(page) || 0, 0);
  const safePageSize = Math.min(Math.max(Number(pageSize) || 100, 1), 200);

  return request(
    `/public/oracles?network=Base&page=${safePage}&pageSize=${safePageSize}`
  );
}

export async function getBaseOracle(symbol) {
  if (!symbol) throw new Error('symbol is required');

  return request(
    `/public/oracles/${encodeURIComponent(symbol)}?network=Base`
  );
}

export async function getStockPrice(symbol) {
  if (!symbol) throw new Error('symbol is required');

  return request(
    `/public/assets/${encodeURIComponent(symbol)}/price-data`
  );
}

export async function getStockMultiplier(symbol) {
  if (!symbol) throw new Error('symbol is required');

  return request(
    `/public/assets/${encodeURIComponent(symbol)}/multiplier?network=Base`
  );
}