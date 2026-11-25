import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import { ToastProvider } from '@/components/ui/toast';
import { siteConfig } from '@/lib/site-config';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Airport Hospitality Services`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [{ url: '/images/hero-lounge.webp' }],
  },
  icons: { icon: '/images/monogram.png' },
};

export const viewport: Viewport = {
  themeColor: '#2d1107',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
