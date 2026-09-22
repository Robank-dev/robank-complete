import './globals.css';
import Providers from '@/components/Providers';
import { CursorScene, IntroLoader } from '@/components/Experience';

export const metadata = {
  title: 'ROBANK — Your money. Your agent. Your bank.',
  description: 'A modern financial interface for your money, payments and personal agent.',
  icons: { icon: '/robank-mark.png' }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <IntroLoader />
        <CursorScene />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
