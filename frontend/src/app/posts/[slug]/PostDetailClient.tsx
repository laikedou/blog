'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { toast } from 'sonner';
import Footer from '@/components/Footer';
import { posts as postsApi, comments as commentsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { animate, stagger } from 'animejs';
import { Calendar, Eye, MessageSquare, User } from 'lucide-react';

interface PostDetailClientProps {
  post: any;
  notFound: boolean;
}

export default function PostDetailClient({ post: initialPost, notFound: initialNotFound }: PostDetailClientProps) {
  const { slug } = { slug: typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '' };
  const { user, isAuthenticated } = useAuth();
  const [post, setPost] = useState<any>(initialPost);
  const [loading, setLoading] = useState(!initialPost);
  const [notFound, setNotFound] = useState(initialNotFound);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // If initial post was provided from server, skip client fetch
  // If not (e.g. client navigation), fetch from client
  useEffect(() => {
    if (initialPost) return;
    const slugFromPath = window.location.pathname.split('/').pop();
    if (!slugFromPath) return;
    postsApi.getBySlug(slugFromPath)
      .then(setPost)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [initialPost]);

  useEffect(() => {
    if (!loading && post && contentRef.current) {
      animate(contentRef.current.children, {
        opacity: [0, 1],
        translateY: [15, 0],
        easing: 'easeOutCubic',
        duration: 500,
        delay: stagger(60),
      });
    }
  }, [loading, post]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !post) return;
    setSubmitting(true);
    try {
      await commentsApi.create({ content: commentText, postId: post.id });
      setCommentText('');
      const updated = await postsApi.getBySlug(post.slug);
      setPost(updated);
    } catch (err: any) { toast.error(err.message); }
    setSubmitting(false);
  };

  if (loading) return (
    <><Header /><main className="flex-1"><div className="content-container mx-auto px-6 py-12"><Skeleton className="h-10 w-2/3 mb-4" /><Skeleton className="h-4 w-1/3 mb-8" /><Skeleton className="h-96 rounded-editorial" /></div></main><Footer /></>
  );

  if (notFound || !post) return (
    <><Header /><main className="flex-1"><div className="content-container mx-auto px-6 py-24 text-center"><h1 className="font-display text-display-xl text-ink mb-4">{t('posts.notFound')}</h1><p className="text-body text-ink-muted mb-8">{t('posts.notFoundDesc')}</p><Link href="/"><Button>{t('common.backToHome')}</Button></Link></div></main><Footer /></>
  );

  const date = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  return (
    <>
      <Header />
      <main className="flex-1 bg-cream-100">
        <article className="content-container py-12 lg:py-16">
          {/* Breadcrumb navigation for SEO */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-2 text-body-sm text-ink-muted" itemScope itemType="https://schema.org/BreadcrumbList">
              <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <Link href="/" itemProp="item" className="hover:text-clay transition-colors"><span itemProp="name">{t('posts.breadcrumbHome')}</span></Link>
                <meta itemProp="position" content="1" />
                <span className="mx-2">/</span>
              </li>
              {post.category && (
                <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                  <Link href={`/category/${post.category.slug}`} itemProp="item" className="hover:text-clay transition-colors"><span itemProp="name">{post.category.name}</span></Link>
                  <meta itemProp="position" content="2" />
                  <span className="mx-2">/</span>
                </li>
              )}
              <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <span itemProp="name" className="text-ink">{post.title}</span>
                <meta itemProp="position" content={post.category ? '3' : '2'} />
              </li>
            </ol>
          </nav>

          <div ref={contentRef} className="space-y-6 mb-12">
            {post.category && (
              <Link href={`/category/${post.category.slug}`}>
                <Badge variant="outline" className="text-caption" style={{ color: post.category.color, borderColor: post.category.color + '40' }}>
                  {post.category.name}
                </Badge>
              </Link>
            )}

            <h1 className="font-display text-display-xl text-ink text-balance leading-tight">{post.title}</h1>

            {/* Author and meta info */}
            <div className="flex flex-wrap items-center gap-5 text-body-sm text-ink-muted">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-cream-300 flex items-center justify-center">
                  <User className="h-4 w-4 text-ink-muted" aria-hidden="true" />
                </div>
                <span className="text-ink-soft" itemProp="author">{post.author.displayName}</span>
              </div>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                <time dateTime={post.publishedAt || post.createdAt}>{date}</time>
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t('posts.views', { count: post.viewCount })}</span>
              </span>
              {post.comments && (
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t('posts.comments', { count: post.comments.length })}</span>
                </span>
              )}
              {post.aiGenerated && <Badge variant="default" className="text-caption-sm">AI</Badge>}
            </div>

            {post.featuredImage && (
              <figure className="rounded-editorial overflow-hidden shadow-card">
                <img
                  src={post.featuredImage}
                  alt={post.seoDescription || post.title}
                  className="w-full aspect-[21/9] object-cover"
                  loading="eager"
                />
                {post.seoDescription && (
                  <figcaption className="text-caption-sm text-ink-muted px-4 py-2 italic">
                    {post.seoDescription}
                  </figcaption>
                )}
              </figure>
            )}
          </div>

          {/* Editorial content */}
          <div className="prose-editorial" dangerouslySetInnerHTML={{ __html: post.content }} />

          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-16 pt-8 border-t border-border">
              {post.tags.map((tag: any) => (
                <Link key={tag.id} href={`/tag/${tag.slug}`}>
                  <Badge variant="outline" className="hover:bg-cream-200 cursor-pointer transition-colors" rel="tag">#{tag.name}</Badge>
                </Link>
              ))}
            </div>
          )}

          {/* Comments section */}
          <section className="mt-20 pt-12 border-t border-border" aria-labelledby="comments-heading">
            <h2 id="comments-heading" className="font-display text-display-md text-ink mb-8">{t('posts.comments', { count: post.comments?.length || 0 })}</h2>

            {isAuthenticated ? (
              <form onSubmit={handleComment} className="mb-12">
                <Textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder={t('posts.commentPlaceholder')} rows={3} className="mb-3" required />
                <Button type="submit" disabled={submitting}>{submitting ? t('posts.posting') : t('posts.submitComment')}</Button>
              </form>
            ) : (
              <Card className="mb-12 bg-cream-200 border-0 shadow-none">
                <CardContent className="p-6 text-center">
                  <p className="text-body text-ink-muted">
                    <Link href="/login" className="text-clay hover:underline font-medium">{t('nav.signIn')}</Link> {t('posts.loginToComment')}
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="space-y-5">
              {post.comments?.map((comment: any) => (
                <Card key={comment.id} className="shadow-card">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-cream-300 flex items-center justify-center" aria-hidden="true">
                        <span className="text-caption-sm font-medium text-ink-muted">{comment.author.displayName.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <span className="text-body-sm font-medium text-ink">{comment.author.displayName}</span>
                        <span className="text-body-sm text-ink-muted ml-3">
                          <time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleDateString()}</time>
                        </span>
                      </div>
                    </div>
                    <p className="text-body text-ink-soft">{comment.content}</p>

                    {comment.replies?.map((reply: any) => (
                      <div key={reply.id} className="ml-10 mt-5 pt-5 border-t border-border">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-body-sm font-medium text-ink">{reply.author.displayName}</span>
                          <span className="text-body-sm text-ink-muted">
                            <time dateTime={reply.createdAt}>{new Date(reply.createdAt).toLocaleDateString()}</time>
                          </span>
                        </div>
                        <p className="text-body text-ink-soft">{reply.content}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
              {(!post.comments || post.comments.length === 0) && (
                <p className="text-body text-ink-muted text-center py-12">{t('posts.noCommentsDetailed')}</p>
              )}
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
