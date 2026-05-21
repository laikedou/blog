import { Metadata } from 'next';
import Link from 'next/link';
import { getSiteConfigServer } from '@/lib/site-config-server';
import { SITE_CONFIG } from '@/lib/seo';
import PolicyContent from './PolicyContent';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy — how we collect, use, and protect your personal information.',
  alternates: { canonical: `${SITE_CONFIG.url}/privacy-policy` },
  openGraph: {
    title: `Privacy Policy | ${SITE_CONFIG.name}`,
    description: 'Learn how we collect, use, and protect your personal information.',
    url: `${SITE_CONFIG.url}/privacy-policy`,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
};

export default async function PrivacyPolicyPage() {
  const config = await getSiteConfigServer();
  const content = config?.privacyPolicyContent || '';
  const siteTitle = config?.siteTitle || SITE_CONFIG.name;

  return (
    <main className="section-container py-section-md">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-body-sm text-clay hover:text-clay-dark transition-colors">
            &larr; Back to Home
          </Link>
        </div>
        <PolicyContent title="Privacy Policy" content={content} siteTitle={siteTitle} />
      </div>
    </main>
  );
}
