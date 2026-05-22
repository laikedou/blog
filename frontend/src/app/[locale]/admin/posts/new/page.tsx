'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { posts as postsApi, categories as categoriesApi, tags as tagsApi, ai as aiApi } from '@/lib/api';
import AITools from '@/components/AITools';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const RichEditor = dynamic(() => import('@/components/RichEditor'), { ssr: false });

export default function NewPostPage() {
  const t = useTranslations();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: '', content: '', excerpt: '', slug: '', status: 'draft',
    categoryId: '', tagIds: [] as number[], featuredImage: '',
    seoTitle: '', seoDescription: '',
  });

  useEffect(() => {
    categoriesApi.list().then(setCategories);
    tagsApi.list().then(setAllTags);
  }, []);

  // Warn about unsaved changes
  useEffect(() => {
    const hasContent = form.title || form.content || form.excerpt;
    if (!hasContent) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [form.title, form.content, form.excerpt]);

  const handleChange = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));
  const toggleTag = (tagId: number) => setForm(prev => ({
    ...prev,
    tagIds: prev.tagIds.includes(tagId) ? prev.tagIds.filter(id => id !== tagId) : [...prev.tagIds, tagId],
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
        title: form.title,
        content: form.content,
        excerpt: form.excerpt || form.content.replace(/<[^>]*>/g, '').substring(0, 200),
        slug: form.slug || undefined,
        status: form.status,
        tagIds: form.tagIds,
      };
      if (form.categoryId && form.categoryId !== 'none') payload.categoryId = Number(form.categoryId);
      if (form.featuredImage) payload.featuredImage = form.featuredImage;
      const post = await postsApi.create(payload);
      router.push(`/admin/posts/${post.id}/edit`);
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            {t('admin.newPost')}
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            {t('admin.createNewDesc')}
          </p>
        </div>
        <AITools onGenerate={handleAIGenerate} currentContent={form.content} currentTitle={form.title} />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <input
                  type="text"
                  value={form.title}
                  onChange={e => handleChange('title', e.target.value)}
                  placeholder={t('admin.postTitle')}
                  className="w-full bg-transparent text-headline-md font-headline-md text-on-surface placeholder:text-on-surface-variant/50 border-0 border-b border-border pb-3 mb-6 focus:outline-none focus:border-primary transition-colors"
                  required
                />
                <RichEditor value={form.content} onChange={val => handleChange('content', val)} placeholder={t('admin.writeContent')} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Publish Card */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="font-headline-md text-headline-md text-on-surface">{t('admin.publish')}</h3>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">{t('admin.selectStatus')}</label>
                  <Select value={form.status} onValueChange={v => handleChange('status', v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">{t('admin.draft')}</SelectItem>
                      <SelectItem value="published">{t('admin.published')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                      {t('admin.saving')}
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      {form.status === 'published' ? t('admin.publish') : t('admin.saveDraft')}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Category Card */}
            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="font-headline-md text-headline-md text-on-surface">{t('admin.category')}</h3>
                <Select value={form.categoryId || 'none'} onValueChange={v => handleChange('categoryId', v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('admin.uncategorized')}</SelectItem>
                    {categories.map(cat => <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Tags Card */}
            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="font-headline-md text-headline-md text-on-surface">{t('admin.tags')}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map(tag => (
                    <Badge
                      key={tag.id}
                      variant={form.tagIds.includes(tag.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* SEO Card */}
            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="font-headline-md text-headline-md text-on-surface">{t('admin.seo')}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">{t('admin.seoTitle')}</label>
                    <Input
                      type="text"
                      value={form.seoTitle}
                      onChange={e => handleChange('seoTitle', e.target.value)}
                      placeholder={t('admin.seoTitle')}
                    />
                  </div>
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">{t('admin.seoDescription')}</label>
                    <Textarea
                      value={form.seoDescription}
                      onChange={e => handleChange('seoDescription', e.target.value)}
                      placeholder={t('admin.seoDescription')}
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">{t('admin.slug')}</label>
                    <Input
                      type="text"
                      value={form.slug}
                      onChange={e => handleChange('slug', e.target.value)}
                      placeholder={t('admin.slug')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Featured Image Card */}
            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="font-headline-md text-headline-md text-on-surface">{t('admin.featuredImage')}</h3>
                <div className="space-y-3">
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
                        <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                        {t('admin.generating')}
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                        {t('admin.generateCover')}
                      </>
                    )}
                  </Button>
                  {form.featuredImage && (
                    <img
                      src={form.featuredImage}
                      alt=""
                      className="mt-3 rounded-xl w-full h-32 object-cover border border-border"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
