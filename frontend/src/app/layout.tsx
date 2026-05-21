import { Inter, JetBrains_Mono } from 'next/font/google';
import { SITE_CONFIG, websiteJsonLd, organizationJsonLd } from '@/lib/seo';
import type { Metadata } from 'next';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: SITE_CONFIG.name,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  generator: 'Next.js',
  applicationName: SITE_CONFIG.name,
  referrer: 'strict-origin-when-cross-origin',
  keywords: ['blog', 'AI', 'frontend', 'web development', 'technology', 'programming', 'Web3', 'blockchain'],
  authors: [{ name: SITE_CONFIG.authorName }],
  creator: SITE_CONFIG.authorName,
  publisher: SITE_CONFIG.authorName,
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  alternates: {
    canonical: SITE_CONFIG.url,
  },
  openGraph: {
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    type: 'website',
    locale: SITE_CONFIG.locale,
    alternateLocale: SITE_CONFIG.localeAlternate,
    images: [
      {
        url: `${SITE_CONFIG.url}/og-default.png`,
        width: 1200,
        height: 630,
        alt: SITE_CONFIG.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    site: SITE_CONFIG.social.twitter,
    creator: SITE_CONFIG.social.twitter,
    images: `${SITE_CONFIG.url}/og-default.png`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: SITE_CONFIG.verification.google,
    yandex: SITE_CONFIG.verification.bing,
  },
  appleWebApp: {
    capable: true,
    title: SITE_CONFIG.name,
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  category: 'technology',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLdWebSite = websiteJsonLd();
  const jsonLdOrg = organizationJsonLd();

  return (
    <html lang="zh-CN" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

        {SITE_CONFIG.verification.baidu && (
          <meta name="baidu-site-verification" content={SITE_CONFIG.verification.baidu} />
        )}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([jsonLdWebSite, jsonLdOrg]),
          }}
        />

        <link rel="dns-prefetch" href={SITE_CONFIG.url} />
        {process.env.NEXT_PUBLIC_API_URL && (
          <link rel="dns-prefetch" href={new URL(SITE_CONFIG.url).origin} />
        )}

        <link rel="preconnect" href={SITE_CONFIG.url} />
        <link rel="alternate" type="application/rss+xml" title={`${SITE_CONFIG.name} RSS Feed`} href="/rss.xml" />
      </head>
      <body className="font-body antialiased" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
