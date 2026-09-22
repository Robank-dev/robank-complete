import { encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import { USDC_BASE_SEPOLIA } from '../constants.js';

export function buildUsdcTransfer({ to, amount }) {
  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'transfer',
    args: [to, parseUnits(String(amount), 6)]
  });
  return {
    to: USDC_BASE_SEPOLIA,
    value: '0',
    data
  };
}
