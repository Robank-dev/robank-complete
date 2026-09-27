'use client';

import { encodeFunctionData, toHex } from 'viem';
import { ROBINHOOD } from '@/lib/chains';
import { confirmedSigner, rpc, sendTx, waitTx, type Review } from '@/lib/tx';

const ERC20 = [
  { type: 'function', name: 'allowance', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'approve', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] }
] as const;

const b64 = (value: unknown) => btoa(unescape(encodeURIComponent(JSON.stringify(value))));

/**
 * Signs an x402 "exact" payment: an EIP-3009 transferWithAuthorization for exactly the quoted USDG
 * amount to the service's payTo address. Nothing moves until the service's facilitator settles it.
 */
export async function signX402Payment({ wallet, requirement, x402Version, resource, review }: { wallet: any; requirement: any; x402Version: number; resource: unknown; review: Review }) {
  const client = await confirmedSigner(wallet, review);
  const now = Math.floor(Date.now() / 1000);
  const nonce = toHex(crypto.getRandomValues(new Uint8Array(32)));
  const authorization = {
    from: wallet.address as `0x${string}`,
    to: requirement.payTo as `0x${string}`,
    value: String(requirement.amount),
    validAfter: String(now - 600),
    validBefore: String(now + Math.min(Number(requirement.maxTimeoutSeconds) || 300, 600)),
    nonce
  };
  const signature = await client.signTypedData({
    account: wallet.address as `0x${string}`,
    domain: { name: requirement.extra?.name || 'Global Dollar', version: requirement.extra?.version || '1', chainId: ROBINHOOD.id, verifyingContract: requirement.asset as `0x${string}` },
    types: { TransferWithAuthorization: [
      { name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' }, { name: 'validBefore', type: 'uint256' }, { name: 'nonce', type: 'bytes32' }
    ] },
    primaryType: 'TransferWithAuthorization',
    message: { ...authorization, value: BigInt(authorization.value), validAfter: BigInt(authorization.validAfter), validBefore: BigInt(authorization.validBefore) }
  });
  const payload = { signature, authorization };
  return x402Version === 1
    ? b64({ x402Version: 1, scheme: 'exact', network: requirement.network, payload })
    : b64({ x402Version: 2, ...(resource ? { resource } : {}), accepted: requirement, payload });
}

/** Approves exactly `amount` of `token` for `spender` if the current allowance is lower. */
export async function ensureAllowance({ wallet, token, spender, amount, review, onStatus }: { wallet: any; token: string; spender: string; amount: bigint; review: Review; onStatus?: (s: string) => void }) {
  const current = await rpc.readContract({ address: token as `0x${string}`, abi: ERC20, functionName: 'allowance', args: [wallet.address, spender as `0x${string}`] });
  if (current >= amount) return;
  const hash = await sendTx(wallet, { to: token as `0x${string}`, data: encodeFunctionData({ abi: ERC20, functionName: 'approve', args: [spender as `0x${string}`, amount] }) }, review, onStatus);
  onStatus?.('Waiting for the approval to confirm…');
  if (!(await waitTx(hash, 120_000))) throw new Error('The approval failed on-chain.');
}

/** Sends a prepared transaction (e.g. swap router calldata) and waits for the receipt. */
export async function sendPrepared({ wallet, tx, review, onStatus }: { wallet: any; tx: { to: string; data: string; value: string }; review: Review; onStatus?: (s: string) => void }) {
  const hash = await sendTx(wallet, { to: tx.to as `0x${string}`, data: tx.data as `0x${string}`, value: BigInt(tx.value || '0') }, review, onStatus);
  onStatus?.('Submitted. Waiting for confirmation…');
  return { hash, ok: await waitTx(hash) };
}
