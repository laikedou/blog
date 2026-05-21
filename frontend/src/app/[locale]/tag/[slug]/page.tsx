import { Metadata } from 'next';
import { SITE_CONFIG, generateListMetadata, breadcrumbJsonLd } from '@/lib/seo';
import TagPageClient from './TagPageClient';

interface TagPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  return generateListMetadata(
    `#${slug} — AI Blog`,
    `Browse all articles tagged with #${slug}. Explore posts about ${slug}.`,
    `/tag/${slug}`,
  );
}

export default async function TagPage({ params }: TagPageProps) {
  const { slug } = await params;
  const jsonLdBreadcrumb = breadcrumbJsonLd([
    { name: 'Home', url: SITE_CONFIG.url },
    { name: `#${slug}`, url: `${SITE_CONFIG.url}/tag/${slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />
      <TagPageClient slug={slug} />
    </>
  );
}
