import { encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import { USDC_BASE_MAINNET, USDG_ROBINHOOD_MAINNET } from '../constants.js';

const TOKENS = {
  base: { USDC: { address: USDC_BASE_MAINNET, decimals: 6 } },
  robinhood: { USDG: { address: USDG_ROBINHOOD_MAINNET, decimals: 6 } }
};

export function buildTokenTransfer({ network = 'base', token = 'USDC', to, amount }) {
  const asset = TOKENS[network]?.[String(token).toUpperCase()];
  if (!asset) throw new Error(`Unsupported token/network: ${token} on ${network}.`);
  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'transfer',
    args: [to, parseUnits(String(amount), asset.decimals)]
  });
  return { to: asset.address, value: '0', data };
}

export function buildUsdcTransfer({ to, amount }) {
  return buildTokenTransfer({ network: 'base', token: 'USDC', to, amount });
}
