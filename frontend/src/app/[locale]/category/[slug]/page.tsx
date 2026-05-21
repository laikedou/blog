import { Metadata } from 'next';
import { SITE_CONFIG, generateListMetadata, breadcrumbJsonLd } from '@/lib/seo';
import CategoryPageClient from './CategoryPageClient';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const categoryName = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
  return generateListMetadata(
    `${categoryName} — AI Blog`,
    `Browse all articles in the ${categoryName} category. Explore posts about ${categoryName}.`,
    `/category/${slug}`,
  );
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const categoryName = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
  const jsonLdBreadcrumb = breadcrumbJsonLd([
    { name: 'Home', url: SITE_CONFIG.url },
    { name: categoryName, url: `${SITE_CONFIG.url}/category/${slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />
      <CategoryPageClient slug={slug} />
    </>
  );
}
