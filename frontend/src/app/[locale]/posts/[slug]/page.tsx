import { Metadata } from 'next';
import { SITE_CONFIG, generatePostMetadata, articleJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import PostDetailClient from './PostDetailClient';

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  try {
    const res = await fetch(`${apiBase}/api/posts/slug/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The requested post could not be found.',
    };
  }
  return generatePostMetadata(post);
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return <PostDetailClient post={null} notFound={true} />;
  }

  const jsonLdArticle = articleJsonLd(post);
  const jsonLdBreadcrumb = breadcrumbJsonLd([
    { name: 'Home', url: SITE_CONFIG.url },
    { name: post.category?.name || 'Posts', url: `${SITE_CONFIG.url}/category/${post.category?.slug || ''}` },
    { name: post.title, url: `${SITE_CONFIG.url}/posts/${post.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([jsonLdArticle, jsonLdBreadcrumb]),
        }}
      />
      <PostDetailClient post={post} notFound={false} />
    </>
  );
}
