import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';
import { createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'ROBANK' }),
    ...(projectId ? [walletConnect({ projectId })] : [])
  ],
  transports: {
    [baseSepolia.id]: http('https://sepolia.base.org')
  },
  ssr: true
});
