import type { Metadata, Viewport } from 'next';
import { Inter, Lexend } from 'next/font/google';
import { Providers } from './providers';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const lexend = Lexend({ subsets: ['latin'], variable: '--font-lexend', display: 'swap' });

const SITE_URL = 'https://trickysolver.academy';

export const viewport: Viewport = {
  themeColor: '#2456e8',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Tricky Solver Academy — Master Mathematics. Excel in Business Studies.',
    template: '%s | Tricky Solver Academy',
  },
  description:
    'Online learning and assessment platform for Kenyan CBC Senior School and KCSE students. Practice questions, mock exams, and expert-marked revision papers in Mathematics and Business Studies.',
  keywords: [
    'KCSE Mathematics',
    'CBC Senior School',
    'Kenyan education',
    'online exams Kenya',
    'Business Studies KCSE',
    'past papers Kenya',
  ],
  authors: [{ name: 'Tricky Solver Academy' }],
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: SITE_URL,
    siteName: 'Tricky Solver Academy',
    title: 'Tricky Solver Academy — Master Mathematics. Excel in Business Studies.',
    description:
      'Online learning and assessment platform for Kenyan CBC Senior School and KCSE students.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Tricky Solver Academy' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tricky Solver Academy',
    description: 'Master Mathematics. Excel in Business Studies.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${lexend.variable} font-sans`}>
        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-white"
          >
            Skip to main content
          </a>
          <Navbar />
          <main id="main-content">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
