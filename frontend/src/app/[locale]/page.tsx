import type { Metadata } from 'next';
import { SITE_CONFIG, generateListMetadata, websiteJsonLd, organizationJsonLd } from '@/lib/seo';
import HomePageClient from './HomePageClient';

export const metadata: Metadata = generateListMetadata(
  SITE_CONFIG.name,
  SITE_CONFIG.description,
  '/',
);

export default function HomePage() {
  const jsonLdWebSite = websiteJsonLd();
  const jsonLdOrg = organizationJsonLd();

  return (
    <>
      {/* JSON-LD structured data for homepage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([jsonLdWebSite, jsonLdOrg]),
        }}
      />
      <HomePageClient />
    </>
  );
}
