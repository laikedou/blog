'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { posts as postsApi, categories as categoriesApi, tags as tagsApi, ai as aiApi } from '@/lib/api';
import AITools from '@/components/AITools';
import FloatingAIMenu from '@/components/FloatingAIMenu';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const RichEditor = dynamic(() => import('@/components/RichEditor'), { ssr: false });

const dotColors = [
  'bg-primary/80', 'bg-tertiary/80', 'bg-on-surface-variant/40',
  'bg-primary/40', 'bg-secondary/80',
];

export default function EditPostPage() {
  const t = useTranslations();
  const { id } = useParams();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFullTools, setShowFullTools] = useState(false);
  const [orbLeft, setOrbLeft] = useState(24);
  const [openStatusSelect, setOpenStatusSelect] = useState(false);
  const [openCategorySelect, setOpenCategorySelect] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: '', content: '', excerpt: '', slug: '', status: 'draft',
    categoryId: '', tagIds: [] as number[], featuredImage: '',
    seoTitle: '', seoDescription: '',
  });

  // Track editor left edge for floating orb position
  useEffect(() => {
    const updatePosition = () => {
      if (editorRef.current) {
        const rect = editorRef.current.getBoundingClientRect();
        setOrbLeft(Math.max(rect.left + 8, 16));
      }
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    const timer = setTimeout(updatePosition, 100);
    return () => {
      window.removeEventListener('resize', updatePosition);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    Promise.all([
      postsApi.get(Number(id)), categoriesApi.list(), tagsApi.list(),
    ]).then(([post, cats, tgs]) => {
      setForm({
        title: post.title || '', content: post.content || '', excerpt: post.excerpt || '', slug: post.slug || '',
        status: post.status || 'draft', categoryId: post.category?.id?.toString() || '',
        tagIds: post.tags?.map((t: any) => t.id) || [],
        featuredImage: post.featuredImage || '', seoTitle: post.seoTitle || '',
        seoDescription: post.seoDescription || '',
      });
      setCategories(cats); setAllTags(tgs);
    }).finally(() => setLoading(false));
  }, [id]);

  // Warn about unsaved changes
  useEffect(() => {
    if (loading) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [loading, form.title, form.content, form.excerpt]);

  const handleChange = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));
  const toggleTag = (tagId: number) => setForm(prev => ({
    ...prev, tagIds: prev.tagIds.includes(tagId) ? prev.tagIds.filter(id => id !== tagId) : [...prev.tagIds, tagId],
  }));

  const handleAIGenerate = (data: any) => {
    if (data.title) handleChange('title', data.title);
    if (data.content) handleChange('content', data.content);
    if (data.excerpt) handleChange('excerpt', data.excerpt);
    if (data.slug) handleChange('slug', data.slug);
    if (data.seoTitle) handleChange('seoTitle', data.seoTitle);
    if (data.seoDescription) handleChange('seoDescription', data.seoDescription);
    if (data.tags) {
      const matchedIds = allTags.filter(t => data.tags.includes(t.name)).map(t => t.id);
      if (matchedIds.length > 0) handleChange('tagIds', matchedIds);
    }
  };

  const handleGenerateCover = async () => {
    if (!form.title.trim()) { toast.error(t('admin.enterTitleFirst')); return; }
    setGeneratingCover(true);
    try {
      const { url } = await aiApi.generateCover({ title: form.title, excerpt: form.excerpt });
      handleChange('featuredImage', url);
    } catch (err: any) { toast.error(err.message || t('admin.failedGenerateCover')); }
    setGeneratingCover(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        title: form.title, content: form.content,
        excerpt: form.excerpt || form.content.replace(/<[^>]*>/g, '').substring(0, 200),
        status: form.status, tagIds: form.tagIds, seoTitle: form.seoTitle, seoDescription: form.seoDescription,
      };
      if (form.categoryId && form.categoryId !== 'none') payload.categoryId = Number(form.categoryId); else payload.categoryId = null;
      if (form.featuredImage) payload.featuredImage = form.featuredImage;
      await postsApi.update(Number(id), payload);
      router.push('/admin/posts');
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="h-[34px] w-48 bg-white/5 animate-pulse rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="h-96 bg-white/5 animate-pulse rounded-xl" />
        </div>
        <div className="space-y-4">
          <div className="h-32 bg-white/5 animate-pulse rounded-xl" />
          <div className="h-24 bg-white/5 animate-pulse rounded-xl" />
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/posts"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </Link>
          <h1 className="font-headline-md text-headline-md text-on-surface">{t('admin.editPost')}</h1>
        </div>
        {form.status === 'published' ? (
          <Badge variant="outline" className="bg-tertiary/10 text-tertiary border-tertiary/20 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            {t('admin.published')}
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-on-surface-variant/10 text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">edit_note</span>
            {t('admin.draft')}
          </Badge>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content - Editor */}
          <div className="lg:col-span-2 space-y-6">
            <Card ref={editorRef}>
              <CardContent className="p-6">
                <Input
                  type="text"
                  value={form.title}
                  onChange={e => handleChange('title', e.target.value)}
                  placeholder={t('admin.postTitle')}
                  required
                  className="border-0 border-b border-border rounded-none px-0 pb-3 mb-6 font-headline-md text-headline-md"
                />
                <RichEditor value={form.content} onChange={val => handleChange('content', val)} placeholder={t('admin.writeContent')} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Publish */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">{t('admin.publish')}</h2>

                {/* Status select */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenStatusSelect(!openStatusSelect)}
                    className="w-full bg-black/20 border border-border rounded-lg px-4 py-2.5 text-body-sm text-on-surface flex items-center justify-between hover:border-white/20 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      {form.status === 'published' ? (
                        <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
                      ) : (
                        <span className="material-symbols-outlined text-[16px] text-on-surface-variant">edit_note</span>
                      )}
                      {form.status === 'draft' ? t('admin.draft') : t('admin.published')}
                    </span>
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant">expand_more</span>
                  </button>
                  {openStatusSelect && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenStatusSelect(false)} />
                      <div
                        className="absolute z-20 mt-1 w-full rounded-lg shadow-lg shadow-black/40 overflow-hidden bg-surface/90 backdrop-blur-xl border border-border"
                      >
                        <button
                          type="button"
                          onClick={() => { handleChange('status', 'draft'); setOpenStatusSelect(false); }}
                          className="w-full px-4 py-2.5 text-body-sm text-on-surface hover:bg-white/5 text-left flex items-center gap-2 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">edit_note</span>
                          {t('admin.draft')}
                        </button>
                        <button
                          type="button"
                          onClick={() => { handleChange('status', 'published'); setOpenStatusSelect(false); }}
                          className="w-full px-4 py-2.5 text-body-sm text-on-surface hover:bg-white/5 text-left flex items-center gap-2 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
                          {t('admin.published')}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      {t('admin.saving')}
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">publish</span>
                      {t('admin.update')}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Category */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">folder</span>
                  {t('admin.category')}
                </h2>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenCategorySelect(!openCategorySelect)}
                    className="w-full bg-black/20 border border-border rounded-lg px-4 py-2.5 text-body-sm text-on-surface flex items-center justify-between hover:border-white/20 transition-colors"
                  >
                    <span>
                      {form.categoryId && form.categoryId !== 'none'
                        ? categories.find(c => c.id.toString() === form.categoryId)?.name
                        : t('admin.uncategorized')}
                    </span>
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant">expand_more</span>
                  </button>
                  {openCategorySelect && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenCategorySelect(false)} />
                      <div className="absolute z-20 mt-1 w-full rounded-lg shadow-lg shadow-black/40 max-h-48 overflow-y-auto bg-surface/90 backdrop-blur-xl border border-border">
                        <button
                          type="button"
                          onClick={() => { handleChange('categoryId', 'none'); setOpenCategorySelect(false); }}
                          className="w-full px-4 py-2.5 text-body-sm text-on-surface-variant hover:bg-white/5 text-left transition-colors"
                        >
                          {t('admin.uncategorized')}
                        </button>
                        {categories.map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => { handleChange('categoryId', String(cat.id)); setOpenCategorySelect(false); }}
                            className="w-full px-4 py-2.5 text-body-sm text-on-surface hover:bg-white/5 text-left transition-colors"
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">label</span>
                  {t('admin.tags')}
                </h2>
                {allTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag, i) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 text-label-sm font-label-sm border"
                        style={{
                          background: form.tagIds.includes(tag.id) ? 'rgba(175, 198, 255, 0.15)' : 'rgba(23, 31, 51, 0.6)',
                          backdropFilter: 'blur(8px)',
                          borderColor: form.tagIds.includes(tag.id) ? 'rgba(175, 198, 255, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                          color: form.tagIds.includes(tag.id) ? '#afc6ff' : 'rgba(200, 210, 230, 0.8)',
                        }}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${dotColors[i % dotColors.length]}`} />
                        {tag.name}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SEO */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">travel_explore</span>
                  {t('admin.seo')}
                </h2>
                <Input
                  type="text"
                  value={form.seoTitle}
                  onChange={e => handleChange('seoTitle', e.target.value)}
                  placeholder={t('admin.seoTitle')}
                />
                <Textarea
                  value={form.seoDescription}
                  onChange={e => handleChange('seoDescription', e.target.value)}
                  placeholder={t('admin.seoDescription')}
                  rows={2}
                  className="resize-none"
                />
                <Input
                  type="text"
                  value={form.slug}
                  onChange={e => handleChange('slug', e.target.value)}
                  placeholder={t('admin.slug')}
                  className="font-mono"
                />
              </CardContent>
            </Card>

            {/* Featured Image */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">image</span>
                  {t('admin.featuredImage')}
                </h2>
                <Input
                  type="text"
                  value={form.featuredImage}
                  onChange={e => handleChange('featuredImage', e.target.value)}
                  placeholder={t('admin.featuredImageUrl')}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateCover}
                  disabled={generatingCover}
                  className="w-full"
                >
                  {generatingCover ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      {t('admin.generating')}
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                      {t('admin.generateCover')}
                    </>
                  )}
                </Button>
                {form.featuredImage && (
                  <img
                    src={form.featuredImage}
                    alt=""
                    className="mt-1 rounded-lg w-full h-32 object-cover border border-border"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Full AI Tools modal */}
      <AITools
        onGenerate={handleAIGenerate}
        currentContent={form.content}
        currentTitle={form.title}
        isOpen={showFullTools}
        onClose={() => setShowFullTools(false)}
      />

      {/* Floating AI orb */}
      <FloatingAIMenu
        onGenerate={handleAIGenerate}
        currentContent={form.content}
        currentTitle={form.title}
        onOpenFullTools={() => setShowFullTools(true)}
        style={{ left: orbLeft }}
      />
    </div>
  );
}
