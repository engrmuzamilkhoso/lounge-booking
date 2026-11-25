import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Majestic Lounge',
  description: 'Airport meet & assist, lounge and premier services',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
