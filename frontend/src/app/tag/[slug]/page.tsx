import { Metadata } from 'next';
import { SITE_CONFIG, generateListMetadata, breadcrumbJsonLd } from '@/lib/seo';
import TagPageClient from './TagPageClient';

interface TagPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  return generateListMetadata(
    `#${params.slug} — AI Blog`,
    `Browse all articles tagged with #${params.slug}. Explore posts about ${params.slug}.`,
    `/tag/${params.slug}`,
  );
}

export default function TagPage({ params }: TagPageProps) {
  const jsonLdBreadcrumb = breadcrumbJsonLd([
    { name: 'Home', url: SITE_CONFIG.url },
    { name: `#${params.slug}`, url: `${SITE_CONFIG.url}/tag/${params.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />
      <TagPageClient slug={params.slug} />
    </>
  );
}
