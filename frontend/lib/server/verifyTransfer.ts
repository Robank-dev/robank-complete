import { chainById, stablecoin } from '@/lib/chains';
import { HttpError } from './http';

const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const topicAddress = (topic: string) => ('0x' + topic.slice(-40)).toLowerCase();

/**
 * Confirms, from the chain itself, that `txHash` succeeded and moved at least `minRaw` of the
 * stablecoin from `from` to `to`. Used before ROBANK records anything as paid.
 */
export async function verifyStableTransfer({ chainId, asset, txHash, from, to, minRaw }: { chainId: number; asset: string; txHash: string; from: string; to: string; minRaw: bigint }) {
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) throw new HttpError(400, 'Enter a valid transaction hash.');
  const chain = chainById(chainId);
  const token = stablecoin(chainId, asset);
  if (!chain || chain.type !== 'evm' || !token) throw new HttpError(400, 'Unsupported payout network or asset.');
  let receipt: any = null;
  for (const url of chain.rpcs) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(url, { method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getTransactionReceipt', params: [txHash] }) });
      clearTimeout(timer);
      const body = await response.json() as any;
      if (body?.error) continue;
      receipt = body?.result ?? null;
      break;
    } catch {}
  }
  if (receipt === null) throw new HttpError(409, 'That transaction is not confirmed on-chain yet. Try again once it confirms.');
  if (receipt.status !== '0x1') throw new HttpError(409, 'That transaction failed on-chain.');
  const moved = (receipt.logs || []).reduce((sum: bigint, log: any) => {
    if (String(log.address).toLowerCase() !== token.address.toLowerCase()) return sum;
    if (log.topics?.[0] !== TRANSFER_TOPIC || log.topics.length < 3) return sum;
    if (topicAddress(log.topics[1]) !== from.toLowerCase() || topicAddress(log.topics[2]) !== to.toLowerCase()) return sum;
    try { return sum + BigInt(log.data); } catch { return sum; }
  }, BigInt(0));
  if (moved < minRaw) throw new HttpError(409, `That transaction does not pay the full reward in ${asset} on ${chain.label} from your wallet to the worker.`);
  return { moved };
}
