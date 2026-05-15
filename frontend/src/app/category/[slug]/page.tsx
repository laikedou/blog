import { Metadata } from 'next';
import { SITE_CONFIG, generateListMetadata, breadcrumbJsonLd } from '@/lib/seo';
import CategoryPageClient from './CategoryPageClient';

interface CategoryPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const categoryName = params.slug.charAt(0).toUpperCase() + params.slug.slice(1).replace(/-/g, ' ');
  return generateListMetadata(
    `${categoryName} — AI Blog`,
    `Browse all articles in the ${categoryName} category. Explore posts about ${categoryName}.`,
    `/category/${params.slug}`,
  );
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const categoryName = params.slug.charAt(0).toUpperCase() + params.slug.slice(1).replace(/-/g, ' ');
  const jsonLdBreadcrumb = breadcrumbJsonLd([
    { name: 'Home', url: SITE_CONFIG.url },
    { name: categoryName, url: `${SITE_CONFIG.url}/category/${params.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />
      <CategoryPageClient slug={params.slug} />
    </>
  );
}
