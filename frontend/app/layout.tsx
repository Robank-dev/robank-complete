import './globals.css';
import './ui.css';
import type { Metadata, Viewport } from 'next';
import Providers from '@/components/Providers';
import { CursorScene } from '@/components/Experience';
import { headers } from 'next/headers';
import { env } from '@/lib/server/env';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL('https://robank.co'),
  title: { default: 'ROBANK — Your money. Your agent. Your wallet.', template: '%s · ROBANK' },
  description: 'Self-custodial money on Robinhood Chain: hold USDG and stock tokens, borrow against them, spend with a Visa card, and get help from an AI agent that never moves money without your signature.',
  icons: { icon: '/robank-mark.png' },
  openGraph: { title: 'ROBANK', description: 'Your money. Your agent. Your wallet.', url: 'https://robank.co', siteName: 'ROBANK', images: ['/banners/robank-hero-wide.jpg'] },
  twitter: { card: 'summary_large_image', title: 'ROBANK', description: 'Your money. Your agent. Your wallet.', images: ['/banners/robank-hero-wide.jpg'] }
};

export const viewport: Viewport = { themeColor: '#030405', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Privy's app id is public; it is read server-side so it never needs a client round-trip.
  const appId = env('PRIVY_APP_ID') || env('NEXT_PUBLIC_PRIVY_APP_ID');
  // Local preview mode with sample data, for screenshots. Never active on the public domain.
  const host = (await headers()).get('host') || '';
  const qa = env('ROBANK_QA') === '1' && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  return (
    <html lang="en">
      <body>
        <CursorScene />
        <Providers appId={appId} qa={qa}>{children}</Providers>
      </body>
    </html>
  );
}
