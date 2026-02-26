import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import { BackgroundAura } from '@/components/ui/BackgroundAura'
import { StructuredData } from '@/app/components/StructuredData'
import './globals.css'

const cormorant = Cormorant_Garamond({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'IGCSE Grade Calculator | Threshold - Estimate Your Grades',
  description: 'Free IGCSE grade calculator using 5 years of Cambridge boundary data. Calculate your grades across 18 subjects for February/March, May/June, and October/November exam sessions.',
  keywords: 'IGCSE grade calculator, IGCSE grade estimator, IGCSE grade boundaries calculator, Cambridge IGCSE grades, grade boundary calculator',

  // Open Graph metadata for social media sharing
  openGraph: {
    title: 'IGCSE Grade Calculator | Threshold',
    description: 'Calculate your Cambridge IGCSE grades using 5 years of historical boundary data across 18 subjects.',
    url: 'https://threshold.app',
    siteName: 'Threshold',
    type: 'website',
    images: [{
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'IGCSE Grade Calculator - Threshold'
    }]
  },

  // Twitter Card metadata
  twitter: {
    card: 'summary_large_image',
    title: 'IGCSE Grade Calculator | Threshold',
    description: 'Calculate your Cambridge IGCSE grades using historical boundary data from all three exam sessions.',
    images: ['/og-image.jpg']
  },

  // Technical SEO metadata
  robots: 'index, follow',
  viewport: 'width=device-width, initial-scale=1',
  verification: {
    google: 'pwWDfBBsayJZBBIAscvAhDskSYxuz7HNGbO7G833Fyc'
  },

  // Icons and favicons
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png'
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <head>
        <meta name="google-site-verification" content="pwWDfBBsayJZBBIAscvAhDskSYxuz7HNGbO7G833Fyc" />
        <StructuredData />
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-PLACEHOLDER123"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-PLACEHOLDER123');
          `
        }} />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <BackgroundAura />
        {children}
      </body>
    </html>
  )
}
