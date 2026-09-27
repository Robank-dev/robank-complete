// $ROBANK — the project token on Robinhood Chain. Paste the contract address below and every placement
// (landing, footer, app sidebar, docs, holdings, send) lights up automatically. Leave empty until launch.
export const ROBANK_TOKEN = {
  symbol: 'ROBANK',
  name: 'ROBANK',
  logo: '/robank-mark.png',
  chainId: 4663,
  address: '0x643890F5c05489caf79d9eC3Ca87c2CF49835152',
  /** Optional: where people can buy it (a DEX link). Shown as a "Buy" button when set. */
  buyUrl: 'https://www.ponsfamily.com/launchpad/0x643890F5c05489caf79d9eC3Ca87c2CF49835152'
};

export const tokenLive = () => /^0x[a-fA-F0-9]{40}$/.test(ROBANK_TOKEN.address);
