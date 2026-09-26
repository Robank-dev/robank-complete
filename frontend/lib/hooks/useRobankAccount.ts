'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useWallets as useSolanaWallets } from '@privy-io/react-auth/solana';

type Linked = { type?: string; walletClientType?: string; chainType?: string; address?: string };

/** The signed-in user's embedded wallets. Linked-account data is authoritative; wallet objects are needed to sign. */
export function useRobankAccount() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { wallets: solanaWallets, ready: solanaReady } = useSolanaWallets();
  const linked = (Array.isArray(user?.linkedAccounts) ? user!.linkedAccounts : []) as Linked[];
  const find = (chain: string) => linked.find((a) => a.type === 'wallet' && a.walletClientType === 'privy' && a.chainType === chain && a.address)?.address || '';
  const evmAddress = find('ethereum');
  const solanaAddress = find('solana');
  const evmWallet = wallets.find((w) => w.walletClientType === 'privy' && w.address.toLowerCase() === evmAddress.toLowerCase()) || wallets.find((w) => w.walletClientType === 'privy');
  const solanaWallet = solanaWallets.find((w: any) => w.address === solanaAddress) || solanaWallets[0];
  return {
    ready,
    authenticated,
    user,
    email: user?.email?.address || '',
    evmAddress,
    solanaAddress,
    evmWallet,
    solanaWallet,
    walletsReady: walletsReady && solanaReady
  };
}
