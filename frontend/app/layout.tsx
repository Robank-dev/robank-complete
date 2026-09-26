import './globals.css';
import './ui.css';
import type { Metadata, Viewport } from 'next';
import Providers from '@/components/Providers';
import { CursorScene } from '@/components/Experience';
import { env } from '@/lib/server/env';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL('https://robank.co'),
  title: { default: 'ROBANK — Your money. Your agent. Your wallet.', template: '%s · ROBANK' },
  description: 'Self-custodial money app: hold stablecoins and tokenized stocks, send across networks, borrow against collateral, and get help from an AI agent that never moves money without your signature.',
  icons: { icon: '/robank-mark.png' },
  openGraph: { title: 'ROBANK', description: 'Your money. Your agent. Your wallet.', url: 'https://robank.co', siteName: 'ROBANK', images: ['/banners/robank-hero-wide.jpg'] },
  twitter: { card: 'summary_large_image', title: 'ROBANK', description: 'Your money. Your agent. Your wallet.', images: ['/banners/robank-hero-wide.jpg'] }
};

export const viewport: Viewport = { themeColor: '#030405', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Privy's app id is public; it is read server-side so it never needs a client round-trip.
  const appId = env('PRIVY_APP_ID') || env('NEXT_PUBLIC_PRIVY_APP_ID');
  return (
    <html lang="en">
      <body>
        <CursorScene />
        <Providers appId={appId}>{children}</Providers>
      </body>
    </html>
  );
}
