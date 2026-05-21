'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PostHero from '@/components/PostHero';
import PostSidebar from '@/components/PostSidebar';
import { posts as postsApi, comments as commentsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownComponents } from '@/lib/markdown';
import CommentLikeButton from '@/components/CommentLikeButton';
import { animate, stagger } from 'animejs';
import { MessageSquare, Heart, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { toast } from 'sonner';

interface PostDetailClientProps {
  post: any;
  notFound: boolean;
}

export default function PostDetailClient({ post: initialPost, notFound: initialNotFound }: PostDetailClientProps) {
  const { user, isAuthenticated } = useAuth();
  const [post, setPost] = useState<any>(initialPost);
  const [loading, setLoading] = useState(!initialPost);
  const [notFound, setNotFound] = useState(initialNotFound);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);
  const t = useTranslations();

  // Client-side fetch fallback
  useEffect(() => {
    if (initialPost) return;
    const slugFromPath = window.location.pathname.split('/').pop();
    if (!slugFromPath) return;
    postsApi.getBySlug(slugFromPath)
      .then(setPost)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [initialPost]);

  // Staggered entrance animation for content
  useEffect(() => {
    if (!loading && post && contentRef.current) {
      const els = contentRef.current.querySelectorAll('.prose-editorial > *');
      animate(els, {
        opacity: [0, 1],
        translateY: [20, 0],
        easing: 'easeOutCubic',
        duration: 600,
        delay: stagger(50, { start: 200 }),
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
      toast.success(t('posts.submitComment') + ' ✓');
      // Scroll to the new comment
      setTimeout(() => {
        commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 300);
    } catch (err: any) {
      toast.error(err.message);
    }
    setSubmitting(false);
  };

  const scrollToComments = () => {
    commentsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex-1">
          <div className="max-w-grid mx-auto px-3 sm:px-6 py-12">
            <Skeleton className="aspect-[21/7] rounded-2xl mb-8" />
            <Skeleton className="h-10 w-2/3 mb-4" />
            <Skeleton className="h-5 w-1/3 mb-8" />
            <div className="max-w-reading mx-auto space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (notFound || !post) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center py-24 px-6">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface-container-high flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-ink-muted" />
            </div>
            <h1 className="font-display text-display-md text-ink mb-3">{t('posts.notFound')}</h1>
            <p className="text-body text-ink-muted mb-8">{t('posts.notFoundDesc')}</p>
            <Link href="/">
              <Button>{t('common.backToHome')}</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-background">
        <div className="max-w-grid mx-auto px-3 sm:px-6 pb-section">
          <PostHero post={post} />

          {/* Two-column layout */}
          <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-10">
            {/* Main content */}
            <div className="min-w-0" ref={contentRef}>
              {/* Article content */}
              <div className="prose-editorial-enhanced" dangerouslySetInnerHTML={{ __html: post.content }} />

              {/* Tags */}
              {post.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-16 pt-8 border-t border-outline-variant/30">
                  {post.tags.map((tag: any) => (
                    <Link key={tag.id} href={`/tag/${tag.slug}`}>
                      <Badge variant="outline" className="hover:bg-surface-container-high cursor-pointer transition-colors px-3 py-1 text-caption-sm border-outline-variant/50" rel="tag">
                        #{tag.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}

              {/* Engagement bar */}
              <div className="flex items-center justify-between mt-10 pt-8 border-t border-outline-variant/30">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={scrollToComments}
                    className="gap-1.5 text-ink-muted hover:text-ink border-outline-variant/50"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {post.comments?.length || 0}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success(t('common.copied'));
                    }}
                    className="text-ink-muted hover:text-ink"
                  >
                    {t('posts.share')}
                  </Button>
                </div>
              </div>

              {/* Comments */}
              <section ref={commentsRef} className="mt-16 pt-12 border-t border-outline-variant/30" aria-labelledby="comments-heading">
                <h2 id="comments-heading" className="font-display text-display-sm text-ink mb-8 flex items-center gap-3">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  {t('posts.comments', { count: post.comments?.length || 0 })}
                </h2>

                {isAuthenticated ? (
                  <form onSubmit={handleComment} className="mb-10">
                    <div className="relative">
                      <Textarea
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        placeholder={t('posts.commentPlaceholder')}
                        rows={3}
                        className="pr-12 mb-3 resize-none bg-surface-container-low border-outline-variant/50 focus:border-primary/50"
                        required
                      />
                      <Button
                        type="submit"
                        disabled={submitting || !commentText.trim()}
                        size="sm"
                        className="absolute bottom-5 right-3 gap-1.5"
                      >
                        {submitting ? (
                          <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Card className="mb-10 bg-surface-container-low border-outline-variant/30 shadow-none">
                    <CardContent className="p-6 text-center">
                      <p className="text-body-sm text-ink-muted">
                        <Link href="/login" className="text-primary hover:underline font-medium">{t('nav.signIn')}</Link>
                        {' '}{t('posts.loginToComment')}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Comment list */}
                <div className="space-y-4">
                  {post.comments?.map((comment: any) => (
                    <Card key={comment.id} className="bg-surface-container-low/50 border-outline-variant/30 shadow-none hover:border-outline-variant/50 transition-colors">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-tertiary/30 flex items-center justify-center shrink-0 ring-1 ring-primary/20">
                            <span className="text-caption-sm font-semibold text-primary">{comment.author.displayName.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-body-sm font-semibold text-ink">{comment.author.displayName}</span>
                              {comment.author.role === 'admin' && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">STAFF</Badge>
                              )}
                              <span className="text-caption-sm text-ink-muted">
                                <time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleDateString()}</time>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-body-sm text-ink-soft ml-12">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{comment.content}</ReactMarkdown>
                        </div>
                        <div className="mt-3 ml-12">
                          <CommentLikeButton commentId={comment.id} initialLikes={comment.likesCount} />
                        </div>

                        {/* Replies */}
                        {comment.replies?.map((reply: any) => (
                          <div key={reply.id} className="ml-12 mt-4 pt-4 border-t border-outline-variant/20">
                            <div className="flex items-start gap-2">
                              <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                                <span className="text-caption-xs font-medium text-ink-muted">{reply.author.displayName.charAt(0).toUpperCase()}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="text-body-sm font-medium text-ink">{reply.author.displayName}</span>
                                  {reply.author.role === 'admin' && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">STAFF</Badge>
                                  )}
                                  <span className="text-caption-sm text-ink-muted">
                                    <time dateTime={reply.createdAt}>{new Date(reply.createdAt).toLocaleDateString()}</time>
                                  </span>
                                </div>
                                <div className="text-body-sm text-ink-soft">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{reply.content}</ReactMarkdown>
                                </div>
                                <div className="mt-1">
                                  <CommentLikeButton commentId={reply.id} initialLikes={reply.likesCount} />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {(!post.comments || post.comments.length === 0) && (
                  <div className="text-center py-16">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-surface-container-high flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-ink-muted" />
                    </div>
                    <p className="text-body text-ink-muted">{t('posts.noCommentsDetailed')}</p>
                  </div>
                )}
              </section>
            </div>

            {/* Desktop sidebar */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <PostSidebar post={post} />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: expandable TOC + sidebar */}
        <div className="lg:hidden border-t border-outline-variant/20 bg-surface-container-low/30">
          <button
            onClick={() => setTocOpen(!tocOpen)}
            className="w-full flex items-center justify-between px-6 py-4 text-body-sm text-ink-muted hover:text-ink transition-colors"
          >
            <span className="flex items-center gap-2">
              {t('posts.tableOfContents')}
            </span>
            {tocOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {tocOpen && (
            <div className="px-6 pb-6">
              <PostSidebar post={post} />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
