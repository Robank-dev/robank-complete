'use client';

import { createPublicClient, createWalletClient, custom, fallback, formatEther, http, type Hex } from 'viem';
import { ROBINHOOD } from './chains';
import { amount as fmtAmount, usd } from './format';
import { ethPriceUsd } from './hooks/usePortfolio';
import { requestConfirm, type ConfirmRequest } from './txConfirm';
import { robinhood } from './wagmi';

/** Browser reads go through ROBANK's relay first (works where the public RPC is blocked), then direct. */
export const rpc = createPublicClient({
  chain: robinhood,
  transport: fallback([http('/api/rpc', { retryCount: 1 }), ...ROBINHOOD.rpcs.map((url) => http(url))]),
  pollingInterval: 1500
});

export class TxCancelled extends Error {
  constructor() { super('You cancelled. Nothing was sent.'); this.name = 'TxCancelled'; }
}

export type Review = Omit<ConfirmRequest, 'fee' | 'blocked'>;
export type TxRequest = { to: `0x${string}`; data?: Hex; value?: bigint };

function feeLabel(wei: bigint) {
  const eth = Number(formatEther(wei));
  const price = ethPriceUsd();
  const shown = eth < 0.000001 ? '< 0.000001' : `≈ ${fmtAmount(String(eth), 6)}`;
  return `${shown} ETH${price ? ` (${eth * price < 0.01 ? '< $0.01' : usd(eth * price)})` : ''}`;
}

function remember(address: string, hash: string, title: string) {
  try {
    const key = `rb:pending:${address.toLowerCase()}`;
    const list = JSON.parse(localStorage.getItem(key) || '[]').filter((p: any) => Date.now() - p.at < 3_600_000);
    localStorage.setItem(key, JSON.stringify([{ hash, title, at: Date.now() }, ...list].slice(0, 20)));
  } catch {}
}

/**
 * Every on-chain action goes through here: estimate the ETH network fee, show ROBANK's own
 * confirmation sheet, sign in the embedded wallet (no Privy UI) and broadcast. Returns the hash.
 */
export async function sendTx(wallet: any, tx: TxRequest, review: Review, onStatus?: (s: string) => void): Promise<Hex> {
  if (!wallet?.address) throw new Error('Your wallet is still loading. Try again in a moment.');
  const from = wallet.address as `0x${string}`;
  const value = tx.value ?? BigInt(0);
  onStatus?.('Preparing…');
  const [gas, fees, nonce, balance] = await Promise.all([
    rpc.estimateGas({ account: from, to: tx.to, data: tx.data, value }).catch((error) => {
      if (/insufficient funds/i.test(String(error?.message || error))) throw new Error('You need a little ETH on Robinhood Chain to pay the network fee. Add some ETH and try again.');
      throw error;
    }),
    rpc.estimateFeesPerGas(),
    rpc.getTransactionCount({ address: from, blockTag: 'pending' }),
    rpc.getBalance({ address: from })
  ]);
  const gasLimit = gas * BigInt(12) / BigInt(10);
  const maxFee = gasLimit * fees.maxFeePerGas;
  const blocked = balance < maxFee + value
    ? `You need a little ETH on Robinhood Chain to pay the network fee (${feeLabel(maxFee)}). You have ${fmtAmount(formatEther(balance), 6)} ETH.`
    : undefined;
  onStatus?.('Waiting for your confirmation…');
  if (!(await requestConfirm({ ...review, fee: feeLabel(gas * fees.maxFeePerGas), blocked }))) throw new TxCancelled();

  onStatus?.('Signing…');
  await wallet.switchChain(ROBINHOOD.id);
  const client = createWalletClient({ account: from, chain: robinhood, transport: custom(await wallet.getEthereumProvider()) });
  // Gas, fees and nonce are fixed here so the wallet signs exactly what the sheet showed.
  const hash = await client.sendTransaction({
    account: from, chain: robinhood, to: tx.to, data: tx.data, value,
    gas: gasLimit, maxFeePerGas: fees.maxFeePerGas, maxPriorityFeePerGas: fees.maxPriorityFeePerGas, nonce
  });
  remember(from, hash, review.title);
  return hash;
}

/** Waits for the receipt through the relay. Throws on timeout so callers can tell "unknown" from "failed". */
export async function waitTx(hash: Hex, timeout = 150_000) {
  const receipt = await rpc.waitForTransactionReceipt({ hash, timeout });
  return receipt.status === 'success';
}

/** Signature requests (e.g. x402 payments) get the same confirmation sheet before anything is signed. */
export async function confirmedSigner(wallet: any, review: Review) {
  if (!(await requestConfirm({ ...review, action: review.action || 'Sign' }))) throw new TxCancelled();
  await wallet.switchChain(ROBINHOOD.id);
  return createWalletClient({ account: wallet.address as `0x${string}`, chain: robinhood, transport: custom(await wallet.getEthereumProvider()) });
}
