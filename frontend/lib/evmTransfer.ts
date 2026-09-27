'use client';

import { encodeFunctionData } from 'viem';
import { stablecoin } from './chains';
import { sendTx, waitTx, type Review } from './tx';

const ERC20_TRANSFER = [{ type: 'function', name: 'transfer', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] }] as const;

/** Sends a stablecoin from the user's embedded wallet after ROBANK's confirmation sheet, and waits for the receipt. */
export async function sendStable({ wallet, chainId, asset, to, units, review, onHash, onStatus }: { wallet: any; chainId: number; asset: string; to: string; units: bigint; review: Review; onHash?: (hash: string) => void; onStatus?: (s: string) => void }) {
  const token = stablecoin(chainId, asset);
  if (!token) throw new Error('Unsupported asset or network.');
  const hash = await sendTx(wallet, { to: token.address as `0x${string}`, data: encodeFunctionData({ abi: ERC20_TRANSFER, functionName: 'transfer', args: [to as `0x${string}`, units] }) }, review, onStatus);
  onHash?.(hash);
  if (!(await waitTx(hash))) throw new Error('The payment failed on-chain. Your funds did not move.');
  return hash;
}
