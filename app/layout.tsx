import type { Metadata } from 'next'
import type { Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { ErrorBoundary } from '@/components/error-boundary'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

const SITE_URL = 'https://ghostsplits.com'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
}

export const metadata: Metadata = {
  title: {
    default: 'GhostSplits - Easy Expense Splitter',
    template: '%s | GhostSplits',
  },
  description: 'Split expenses with friends easily — realtime updates, no login required. Perfect for trips, dinners, and shared costs.',
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'GhostSplits - Easy Expense Splitter',
    description: 'Split expenses with friends easily — realtime updates, no login required.',
    url: SITE_URL,
    siteName: 'GhostSplits',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/GhostSplits_LOGO.png',
        width: 512,
        height: 512,
        alt: 'GhostSplits Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'GhostSplits - Easy Expense Splitter',
    description: 'Split expenses with friends easily — realtime updates, no login required.',
    images: ['/GhostSplits_LOGO.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/favicon.png' },
      { url: '/GhostSplits_LOGO.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <SpeedInsights />
      </body>
    </html>
  )
}
