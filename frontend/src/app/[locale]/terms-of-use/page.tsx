import { Metadata } from 'next';
import Link from 'next/link';
import { getSiteConfigServer } from '@/lib/site-config-server';
import { SITE_CONFIG } from '@/lib/seo';
import PolicyContent from '../privacy-policy/PolicyContent';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms of Use — the rules and guidelines for using our website and services.',
  alternates: { canonical: `${SITE_CONFIG.url}/terms-of-use` },
  openGraph: {
    title: `Terms of Use | ${SITE_CONFIG.name}`,
    description: 'Read the terms and guidelines for using our website and services.',
    url: `${SITE_CONFIG.url}/terms-of-use`,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
};

export default async function TermsOfUsePage() {
  const config = await getSiteConfigServer();
  const content = config?.termsOfUseContent || '';
  const siteTitle = config?.siteTitle || SITE_CONFIG.name;

  return (
    <main className="section-container py-section-md">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-body-sm text-clay hover:text-clay-dark transition-colors">
            &larr; Back to Home
          </Link>
        </div>
        <PolicyContent title="Terms of Use" content={content} siteTitle={siteTitle} />
      </div>
    </main>
  );
}
