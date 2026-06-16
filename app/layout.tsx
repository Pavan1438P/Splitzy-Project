import type { Metadata } from 'next'
import type { Viewport } from 'next'
import { Geist } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Script from 'next/script'
import { ErrorBoundary } from '@/components/error-boundary'
import './globals.css'

const _geist = Geist({ subsets: ['latin'], display: 'swap' })

const SITE_URL = 'https://ghostsplits.com'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
}

export const metadata: Metadata = {
  title: {
    default: 'GhostSplits - Ghost Splits Expense Splitter',
    template: '%s | GhostSplits',
  },
  description: 'Split expenses with friends easily — realtime updates, no login required. Perfect for trips, outings, dinners, or any kind of shared costs.',
  keywords: [
    'GhostSplits',
    'ghost splits',
    'ghostsplit',
    'ghostsplitter',
    'expense splitter',
    'expense split',
    'split expenses',
    'shared expenses',
    'bill splitter',
    'group expense tracker',
    'expense sharing app',
    'expense tracker',
    'split bills',
    'split costs',
    'split group expenses',
    'split trip expenses',
    'split dinner expenses',
    'split outings',
    'online expense splitter',
  ],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'GhostSplits - Ghost Splits Expense Splitter',
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
    title: 'GhostSplits - Ghost Splits Expense Splitter',
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
      <head>
        <meta name="google-adsense-account" content="ca-pub-9197617195442082" />
        <meta name="msvalidate.01" content="F02880CBCE69484F8C7698A3FE3AAC73" />
        <meta
          name="keywords"
          content="GhostSplits, ghost splits, ghostsplits, expense splitter, expense split, split expenses, shared expenses, bill splitter, group expense tracker, expense sharing app, expense tracker, split bills, split costs, split group expenses, split trip expenses, split dinner expenses, split outings, online expense splitter"
        />
        <meta name="application-name" content="GhostSplits" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="manifest" href="/site.webmanifest" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'GhostSplits',
            url: SITE_URL,
            description: 'GhostSplits is an easy expense splitter for sharing bills, trips, and group costs.',
            potentialAction: {
              '@type': 'SearchAction',
              target: `${SITE_URL}/?q={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          }),
        }} />
        {process.env.NODE_ENV === 'production' && (
          <>
            <Script
              async
              src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9197617195442082"
              crossOrigin="anonymous"
              strategy="lazyOnload"
            />
            <Script
              src="https://www.googletagmanager.com/gtag/js?id=G-6P42MNC7YT"
              strategy="lazyOnload"
            />
            <Script id="gtag-init" strategy="lazyOnload">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);} 
gtag('js', new Date());
gtag('config', 'G-6P42MNC7YT');`}
            </Script>
          </>
        )}
      </head>
      <body className={`${_geist.className} font-sans antialiased`}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        {process.env.NODE_ENV === 'production' && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  )
}
