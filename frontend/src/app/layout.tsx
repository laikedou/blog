import type { Metadata } from 'next';
import { DM_Serif_Display, Sora } from 'next/font/google';
import { AuthProvider } from '@/lib/auth';
import ChatBot from '@/components/ChatBot';
import { CustomHeadInjector } from '@/components/CustomHeadInjector';
import { SITE_CONFIG, websiteJsonLd, organizationJsonLd } from '@/lib/seo';
import './globals.css';

const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-body',
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
    // Baidu uses a different meta tag — injected via custom <head> in the component below
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
    <html lang="en" className={`${dmSerifDisplay.variable} ${sora.variable}`}>
      <head>
        {/* Baidu verification */}
        {SITE_CONFIG.verification.baidu && (
          <meta name="baidu-site-verification" content={SITE_CONFIG.verification.baidu} />
        )}

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([jsonLdWebSite, jsonLdOrg]),
          }}
        />

        {/* DNS prefetch for common origins */}
        <link rel="dns-prefetch" href={SITE_CONFIG.url} />
        {process.env.NEXT_PUBLIC_API_URL && (
          <link rel="dns-prefetch" href={new URL(SITE_CONFIG.url).origin} />
        )}

        {/* Preconnect to key origins */}
        <link rel="preconnect" href={SITE_CONFIG.url} />

        {/* RSS feed */}
        <link rel="alternate" type="application/rss+xml" title={`${SITE_CONFIG.name} RSS Feed`} href="/rss.xml" />
      </head>
      <body className="font-body">
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
          <ChatBot />
          <CustomHeadInjector />
        </AuthProvider>
      </body>
    </html>
  );
}
