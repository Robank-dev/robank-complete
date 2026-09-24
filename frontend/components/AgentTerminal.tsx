'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { formatUnits, isAddress } from 'viem';
import { useAccount, useBalance, useReadContract, useSendTransaction } from 'wagmi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '@/lib/api';
import { BASE_MAINNET_CHAIN_ID, ROBINHOOD_CHAIN_ID } from '@/lib/constants';

const ERC20_ABI = [{ type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] }] as const;

type Asset = 'USDC' | 'USDG';
type Pending = { amount: string; destination: string; asset?: Asset };

export default function AgentTerminal() {
  const searchParams = useSearchParams();
  const { authenticated } = usePrivy();
  const { address, chainId } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const baseEth = useBalance({ address, chainId: BASE_MAINNET_CHAIN_ID, query: { enabled: Boolean(address) } });
  const rhEth = useBalance({ address, chainId: ROBINHOOD_CHAIN_ID, query: { enabled: Boolean(address) } });
  const baseUsdc = useReadContract({ address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', abi: ERC20_ABI, functionName: 'balanceOf', args: address ? [address] : undefined, chainId: BASE_MAINNET_CHAIN_ID, query: { enabled: Boolean(address) } });
  const rhUsdg = useReadContract({ address: '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168', abi: ERC20_ABI, functionName: 'balanceOf', args: address ? [address] : undefined, chainId: ROBINHOOD_CHAIN_ID, query: { enabled: Boolean(address) } });
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<string[]>(["ROBANK AI ready. Try: what's my balance"]);
  const [history, setHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [pending, setPending] = useState<Pending | null>(null);
  const [tx, setTx] = useState<{ to: string; data: `0x${string}`; value?: string; destination: string; amount: string; network: 'base' | 'robinhood'; asset: Asset } | null>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);

  useEffect(() => {
    const service = searchParams.get('service');
    if (!service) return;
    setInput(`Use x402 service ${service}`);
    api.agentMarket(`q=${encodeURIComponent(service)}&limit=10`).then((data) => {
      const match = (data.services || []).find((item: any) => item.slug === service) || null;
      setSelectedService(match);
      setRiskAcknowledged(false);
    }).catch(() => setSelectedService(null));
  }, [searchParams]);

  const walletBalances = {
    USDC: baseUsdc.data === undefined ? null : Number(formatUnits(baseUsdc.data, 6)),
    USDG: rhUsdg.data === undefined ? null : Number(formatUnits(rhUsdg.data, 6)),
    'Base ETH': baseEth.data ? Number(formatUnits(baseEth.data.value, 18)) : null,
    'Robinhood ETH': rhEth.data ? Number(formatUnits(rhEth.data.value, 18)) : null
  };

  function balanceContext() {
    return {
      wallet: {
        connected: Boolean(address),
        address: address ?? null,
        balances: [
          { symbol: 'USDC', balance: walletBalances.USDC == null ? 'loading' : String(walletBalances.USDC), network: 'base' },
          { symbol: 'USDG', balance: walletBalances.USDG == null ? 'loading' : String(walletBalances.USDG), network: 'robinhood' },
          { symbol: 'ETH', balance: walletBalances['Base ETH'] == null ? 'loading' : String(walletBalances['Base ETH']), network: 'base' },
          { symbol: 'ETH', balance: walletBalances['Robinhood ETH'] == null ? 'loading' : String(walletBalances['Robinhood ETH']), network: 'robinhood' }
        ]
      },
      capabilities: ['wallet balance', 'wallet transfers for USDC on Base', 'wallet transfers for USDG on Robinhood Chain', 'payment intent', 'agent information'],
    };
  }

  async function prepareWalletTransfer(amount: string, destination: string, asset: Asset) {
    if (!authenticated) throw new Error('Sign in with email first.');
    if (!address) throw new Error('Your Privy wallet is still loading. Try again in a moment.');
    const network = asset === 'USDC' ? 'base' : 'robinhood';
    const targetChainId = asset === 'USDC' ? BASE_MAINNET_CHAIN_ID : ROBINHOOD_CHAIN_ID;
    const available = asset === 'USDC' ? walletBalances.USDC : walletBalances.USDG;
    if (available != null && Number(amount) > available) {
      const otherAsset: Asset = asset === 'USDC' ? 'USDG' : 'USDC';
      const otherBalance = otherAsset === 'USDC' ? walletBalances.USDC : walletBalances.USDG;
      const alternative = otherBalance != null && otherBalance >= Number(amount) ? ` You have enough ${otherAsset} (${otherBalance}), but it uses ${otherAsset === 'USDC' ? 'Base' : 'Robinhood Chain'}.` : '';
      throw new Error(`Insufficient ${asset} balance. Available: ${available} ${asset}.${alternative}`);
    }
    if (chainId !== targetChainId) throw new Error(`Switch the Privy wallet to ${network === 'base' ? 'Base' : 'Robinhood Chain'} before signing.`);
    if (!isAddress(destination)) throw new Error('Invalid recipient address.');

    const result = await api.agentPrepare({ walletAddress: address, destination, amount, asset, network });
    if (!result.transaction) {
      const reasons = result.prepared?.policy?.reasons?.join('; ') || 'Action blocked by policy.';
      throw new Error(`Blocked: ${reasons}`);
    }
    setTx({ to: result.transaction.to, data: result.transaction.data as `0x${string}`, value: result.transaction.value, destination, amount, network, asset });
    setPending(null);
    setOutput((prev) => [...prev, `**Ready for review** — ${amount} ${asset} from Wallet → ${destination}`]);
  }
  async function run() {
    if (!input.trim()) return;
    const message = input.trim();
    setInput('');
    setOutput((prev) => [...prev, `> ${message}`]);
    const transfer = message.match(/(?:send|transfer|pay|kirim|bayar)\s+([0-9]+(?:\.[0-9]+)?)\s*(USDC|USDG)?\s+to\s+(0x[a-fA-F0-9]{40})/i);
    try {
      if (transfer) {
        const [, amount, rawAsset, destination] = transfer;
        const asset = rawAsset?.toUpperCase() as Asset | undefined;
        if (!asset) {
          setPending({ amount, destination });
          setOutput((prev) => [...prev, '**Choose asset:** USDC on Base or USDG on Robinhood Chain.']);
          return;
        }
        await prepareWalletTransfer(amount, destination, asset);
        return;
      }

      const marketIntent = /\b(buy|purchase|get|rent|book|find|belikan|carikan|cari|sewa|pesan)\b/i.test(message) && /\b(gpu|compute|inference|browser|scrape|data|api|service|agent)\b/i.test(message);
      if (marketIntent) {
        const q = message.replace(/\b(buy|purchase|get|rent|book|find|belikan|carikan|cari|sewa|pesan)\b/gi, ' ').trim();
        const market = await api.agentMarket(new URLSearchParams({ q: q.slice(0, 80), limit: '5' }).toString());
        const found = Array.isArray(market.services) ? market.services.slice(0, 5) : [];
        if (!found.length) {
          setOutput((prev) => [...prev, '**Agent Market:** I could not find a matching provider. Try a more specific capability.']);
        } else {
          const lines = found.map((s: any, i: number) => `${i + 1}. **${s.name}** · ${s.category} · from $${s.minPriceUsd ?? '—'} · ${s.paymentReady ? 'x402 ready' : 'listed'} · ${Array.isArray(s.networks) ? s.networks.map((n: string) => n === 'eip155:8453' ? 'Base' : n === 'eip155:4663' ? 'Robinhood Chain' : n).join(', ') : 'network pending'}`);
          setOutput((prev) => [...prev, `**Agent Market found ${found.length} provider(s).**\n${lines.join('\n')}\n\nI have not paid anyone yet. Next step is to inspect the provider's actual HTTP 402 terms, check your mandate, and only then request approval/signing when required.`]);
        }
        return;
      }

      if (/\b(balance|saldo)\b/i.test(message)) {
        const c = balanceContext();
        const b = c.wallet.balances;
        setOutput((prev) => [...prev, `**Wallet** ${address ? `(${address})` : '(not connected)'}\n- ${b[0].balance} USDC · Base\n- ${b[1].balance} USDG · Robinhood Chain\n- ${b[2].balance} ETH · Base\n- ${b[3].balance} ETH · Robinhood Chain`]);
        return;
      }

      const result = await api.agent({ message, history, walletAddress: address, context: balanceContext() });
      const response = result.response;
      setHistory((prev) => [...prev.slice(-19), { role: 'user', content: message }, { role: 'assistant', content: response }]);
      setOutput((prev) => [...prev, response]);
    } catch (error) {
      setOutput((prev) => [...prev, error instanceof Error ? error.message : 'Agent error']);
    }
  }
  async function chooseAsset(asset: Asset) {
    if (!pending) return;
    try {
      await prepareWalletTransfer(pending.amount, pending.destination, asset);
    } catch (error) {
      setOutput((prev) => [...prev, error instanceof Error ? error.message : 'Unable to prepare transfer']);
    }
  }

  const serviceBlocked = selectedService && ['high', 'critical', 'blocked'].includes(String(selectedService.riskLevel).toLowerCase());
  const serviceNeedsWarning = Boolean(selectedService && (!selectedService.verified || !['clean'].includes(String(selectedService.riskLevel).toLowerCase())));

  async function signAndSend() {
    if (!tx || !address) return;
    if (serviceBlocked) {
      setOutput((prev) => [...prev, '**Blocked by ROBANK safety policy.** This service is marked high-risk/critical by the discovery source. The transaction will not be signed, even if the user requests it.']);
      return;
    }
    if (serviceNeedsWarning && !riskAcknowledged) {
      setOutput((prev) => [...prev, '**Safety warning:** this provider is not independently verified or is not marked clean by the discovery source. Review the provider, amount, network, and recipient before continuing.']);
      return;
    }
    try {
      const hash = await sendTransactionAsync({ to: tx.to as `0x${string}`, data: tx.data, value: BigInt(tx.value || '0') });
      const confirmation = await api.agentConfirm({ walletAddress: address, destination: tx.destination, amount: tx.amount, txHash: hash, network: tx.network, asset: tx.asset });
      setOutput((prev) => [...prev, confirmation.verified ? `**Confirmed:** ${hash}` : `**Submitted:** ${hash} — awaiting reconciliation.`]);
      setTx(null);
    } catch (error) {
      setOutput((prev) => [...prev, error instanceof Error ? error.message : 'Transaction failed']);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ro-line bg-black/30">
      <div className="agent-terminal-head"><div><span>ROBANK AGENT</span><small>Intent → policy → execution</small></div><i>READY</i></div>
      <div className="agent-suggestions">
        {['What is my balance?', 'Show my assets', 'Prepare 25 USDC to 0x...'].map((prompt) => <button key={prompt} onClick={() => setInput(prompt)}>{prompt}</button>)}
      </div>
      <div className="min-h-[360px] space-y-4 overflow-y-auto p-5 font-mono text-sm leading-6 text-white/75">
        {output.map((line, index) => line.startsWith('> ') ? <div key={index} className="whitespace-pre-wrap text-white">{line}</div> : <div key={index} className="prose prose-invert prose-sm max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{line}</ReactMarkdown></div>)}
      </div>
      {pending && !pending.asset && <div className="flex flex-wrap gap-2 border-t border-ro-line p-3"><span className="agent-choice-label">Choose asset</span><button onClick={() => chooseAsset('USDC')} className="agent-choice agent-choice-primary">USDC · Base</button><button onClick={() => chooseAsset('USDG')} className="agent-choice">USDG · Robinhood Chain</button></div>}
      {tx && <div className="border-t border-ro-line p-3">
        {serviceBlocked ? <div className="rounded-xl border border-white/15 bg-white/[.03] p-3 text-xs leading-5 text-white/60"><b>ROBANK safety block.</b> This service cannot be paid through the agent because its market risk level is {String(selectedService.riskLevel).toUpperCase()}.</div> : serviceNeedsWarning && !riskAcknowledged ? <div className="rounded-xl border border-white/10 bg-white/[.03] p-3"><div className="text-xs leading-5 text-white/55"><b>Review before signing.</b> {selectedService?.verified ? 'The discovery source reports this provider as clean, but it is not independently verified.' : 'The provider is not independently verified by the discovery source.'} Check provider, amount, network and recipient.</div><button onClick={() => setRiskAcknowledged(true)} className="mt-3 rounded-lg border border-white/15 px-3 py-2 text-[10px] text-white/70 hover:bg-white/5">I reviewed this — continue</button></div> : <button onClick={signAndSend} className="rounded-xl bg-white px-4 py-3 text-xs font-semibold text-black">Review & Sign in Wallet</button>}
      </div>}
      <div className="flex border-t border-ro-line p-3"><input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') run(); }} placeholder="send 50 USDC to 0x..." className="flex-1 bg-transparent px-2 font-mono text-sm outline-none" /><button onClick={run} className="rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5">Run</button></div>
    </div>
  );
}
