import type { Metadata } from 'next';
import type { BlogPosting, BreadcrumbList, WebSite, Organization, WithContext } from 'schema-dts';

// ─── Site-wide defaults ────────────────────────────────────────
export const SITE_CONFIG = {
  name: 'AI Blog',
  description: 'A modern personal blog platform exploring frontend engineering, artificial intelligence, Web3, and blockchain technology.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com',
  authorName: 'Frontend Developer & AI Enthusiast',
  locale: 'en_US',
  localeAlternate: 'zh_CN',
  social: {
    twitter: '@yourtwitter',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || '',
    baidu: process.env.NEXT_PUBLIC_BAIDU_VERIFICATION || '',
    bing: process.env.NEXT_PUBLIC_BING_VERIFICATION || '',
  },
} as const;

// ─── Post type used in metadata generation ────────────────────
export interface PostMeta {
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  publishedAt: string | null;
  updatedAt?: string;
  author: { displayName: string; avatar?: string };
  category: { name: string; slug: string } | null;
  tags: { name: string; slug: string }[];
  seoTitle?: string;
  seoDescription?: string;
}

// ─── Generate page metadata ────────────────────────────────────
export function generatePostMetadata(post: PostMeta): Metadata {
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt || `Read about ${post.title}`;
  const url = `${SITE_CONFIG.url}/posts/${post.slug}`;
  const images = post.featuredImage
    ? [{ url: post.featuredImage, width: 1200, height: 630, alt: post.title }]
    : [{ url: `${SITE_CONFIG.url}/og-default.png`, width: 1200, height: 630, alt: SITE_CONFIG.name }];

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_CONFIG.name,
      type: 'article',
      locale: SITE_CONFIG.locale,
      alternateLocale: SITE_CONFIG.localeAlternate,
      publishedTime: post.publishedAt || undefined,
      modifiedTime: post.updatedAt,
      authors: [post.author.displayName],
      tags: post.tags.map(t => t.name),
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images.map(i => i.url),
    },
    robots: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
    },
  };
}

export function generateListMetadata(title: string, description: string, urlPath: string): Metadata {
  const url = `${SITE_CONFIG.url}${urlPath}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_CONFIG.name,
      type: 'website',
      locale: SITE_CONFIG.locale,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

// ─── JSON-LD structured data generators ───────────────────────
export function articleJsonLd(post: PostMeta): WithContext<BlogPosting> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    image: post.featuredImage || undefined,
    datePublished: post.publishedAt || undefined,
    dateModified: post.updatedAt || post.publishedAt || undefined,
    author: {
      '@type': 'Person',
      name: post.author.displayName,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.url}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_CONFIG.url}/posts/${post.slug}`,
    },
    keywords: post.tags.map(t => t.name).join(', '),
    articleSection: post.category?.name || undefined,
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]): WithContext<BreadcrumbList> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function websiteJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function organizationJsonLd(): WithContext<Organization> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/logo.png`,
    description: SITE_CONFIG.description,
    foundingDate: '2024',
  };
}

// ─── SEO Analysis helpers ──────────────────────────────────────
export function calculateSeoScore(post: {
  title: string;
  excerpt: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  featuredImage?: string;
  tags?: { name: string }[];
  slug: string;
}): { score: number; checks: Record<string, { pass: boolean; message: string }> } {
  const checks: Record<string, { pass: boolean; message: string }> = {};
  const plainContent = post.content.replace(/<[^>]*>/g, '').trim();
  const wordCount = plainContent.split(/\s+/).filter(Boolean).length;

  // Title length
  checks.titleLength = post.title.length >= 30 && post.title.length <= 70
    ? { pass: true, message: `Title is ${post.title.length} chars (good: 30-70)` }
    : { pass: false, message: `Title is ${post.title.length} chars (ideal: 30-70)` };

  // SEO title
  checks.seoTitle = post.seoTitle
    ? { pass: true, message: 'Custom SEO title is set' }
    : { pass: false, message: 'Add a custom SEO title under 60 characters' };

  // Meta description
  checks.seoDescription = (post.seoDescription && post.seoDescription.length >= 50 && post.seoDescription.length <= 160)
    ? { pass: true, message: `Meta description is ${post.seoDescription.length} chars (good: 50-160)` }
    : { pass: false, message: 'Add or improve meta description (ideal: 50-160 chars)' };

  // Excerpt
  checks.excerpt = post.excerpt && post.excerpt.length >= 50
    ? { pass: true, message: 'Excerpt is provided' }
    : { pass: false, message: 'Add an excerpt (min 50 chars)' };

  // Content length
  checks.contentLength = wordCount >= 300
    ? { pass: true, message: `${wordCount} words (good for SEO)` }
    : { pass: false, message: `Only ${wordCount} words — aim for 300+` };

  // Featured image
  checks.featuredImage = !!post.featuredImage
    ? { pass: true, message: 'Featured image is set' }
    : { pass: false, message: 'Add a featured image' };

  // Tags
  checks.tags = post.tags && post.tags.length >= 1
    ? { pass: true, message: `${post.tags.length} tag(s) assigned` }
    : { pass: false, message: 'Add at least 1 tag' };

  // Slug
  checks.slug = post.slug && post.slug.length < 100
    ? { pass: true, message: 'Slug is properly formatted' }
    : { pass: false, message: 'Slug is too long (keep under 100 chars)' };

  // Keyword density (check if title words appear in content)
  const titleWords = post.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const densityChecks = titleWords.map(w => ({
    word: w,
    count: (plainContent.toLowerCase().match(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length,
  }));
  const avgDensity = densityChecks.length > 0
    ? densityChecks.reduce((s, c) => s + c.count, 0) / densityChecks.length
    : 0;
  checks.keywordDensity = avgDensity >= 2
    ? { pass: true, message: `Keywords appear ~${avgDensity.toFixed(1)} times on average` }
    : { pass: false, message: 'Title keywords appear too infrequently in content' };

  const totalChecks = Object.keys(checks).length;
  const passedChecks = Object.values(checks).filter(c => c.pass).length;
  const score = Math.round((passedChecks / totalChecks) * 100);

  return { score, checks };
}

// ─── Sitemap helpers ───────────────────────────────────────────
export function generateSitemapEntry(loc: string, priority: number, changefreq: string, lastmod?: string) {
  return { loc, priority, changefreq, lastmod };
}
