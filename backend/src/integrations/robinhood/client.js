const API_URL = 'https://api.robinhood.com/rhj';

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
      throw new Error(`Robinhood API returned invalid JSON: ${response.status}`);
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      `Robinhood API request failed: ${response.status}`
    );
  }

  return data;
}

export async function listAssets() {
  return request('/assets');
}

export async function getAssetPrice(symbol) {
  if (!symbol) throw new Error('symbol is required');

  return request(`/prices/${encodeURIComponent(symbol)}`);
}

export async function listCorporateActions() {
  return request('/corporate-actions');
}

export async function getStockToken(symbol) {
  if (!symbol) throw new Error('symbol is required');

  const data = await listAssets();

  const assets = Array.isArray(data?.assets) ? data.assets : [];

  return (
    assets.find(
      (asset) =>
        String(asset.tokenSymbol || '').toUpperCase() ===
        String(symbol).toUpperCase()
    ) || null
  );
}