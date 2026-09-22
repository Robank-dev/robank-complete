'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';

function short(value?: string) {
  return value ? `${value.slice(0, 6)}…${value.slice(-4)}` : '';
}

export default function WalletConnect() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <button
        onClick={() => disconnect()}
        className="rounded-xl border border-ro-line bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
      >
        {short(address)} · {chainId === 84532 ? 'Sepolia' : `Chain ${chainId}`}
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      {connectors.slice(0, 2).map((connector) => (
        <button
          key={connector.uid}
          disabled={isPending}
          onClick={() => connect({ connector })}
          className="rounded-xl border border-ro-line bg-white/5 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
        >
          {connector.name}
        </button>
      ))}
    </div>
  );
}
