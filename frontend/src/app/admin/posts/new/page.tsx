'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { posts as postsApi, categories as categoriesApi, tags as tagsApi, ai as aiApi } from '@/lib/api';
import AITools from '@/components/AITools';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const RichEditor = dynamic(() => import('@/components/RichEditor'), { ssr: false });

export default function NewPostPage() {
  const { t } = useTranslation();
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
    if (!form.title.trim()) { toast.error('Please enter a title first'); return; }
    setGeneratingCover(true);
    try {
      const { url } = await aiApi.generateCover({ title: form.title, excerpt: form.excerpt });
      handleChange('featuredImage', url);
    } catch (err: any) { toast.error(err.message || 'Failed to generate cover'); }
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
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-display-md text-ink">{t('admin.newPost')}</h1>
        <AITools onGenerate={handleAIGenerate} currentContent={form.content} currentTitle={form.title} />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <Input value={form.title} onChange={e => handleChange('title', e.target.value)} placeholder={t('admin.postTitle')} className="font-display text-display-md border-0 border-b-2 border-border rounded-none px-0 pb-3 mb-6 shadow-none focus-visible:ring-0" required />
              <RichEditor value={form.content} onChange={val => handleChange('content', val)} placeholder="Write your post content here..." />
            </Card>
          </div>

          <div className="space-y-4">
            <Card><CardHeader><CardTitle>Publish</CardTitle></CardHeader><CardContent className="space-y-3">
              <Select value={form.status} onValueChange={val => handleChange('status', val)}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={saving} className="w-full">{saving ? 'Saving...' : form.status === 'published' ? 'Publish' : 'Save Draft'}</Button>
            </CardContent></Card>

            <Card><CardHeader><CardTitle>Category</CardTitle></CardHeader><CardContent>
              <Select value={form.categoryId} onValueChange={val => handleChange('categoryId', val)}>
                <SelectTrigger><SelectValue placeholder="Uncategorized" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Uncategorized</SelectItem>
                  {categories.map(cat => <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardContent></Card>

            <Card><CardHeader><CardTitle>{t('admin.tags')}</CardTitle></CardHeader><CardContent>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map(tag => (
                  <Badge key={tag.id} variant={form.tagIds.includes(tag.id) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => toggleTag(tag.id)}>{tag.name}</Badge>
                ))}
              </div>
            </CardContent></Card>

            <Card><CardHeader><CardTitle>{t('admin.seo')}</CardTitle></CardHeader><CardContent className="space-y-3">
              <Input value={form.seoTitle} onChange={e => handleChange('seoTitle', e.target.value)} placeholder="SEO Title" />
              <Textarea value={form.seoDescription} onChange={e => handleChange('seoDescription', e.target.value)} placeholder="SEO Description" rows={2} />
              <Input value={form.slug} onChange={e => handleChange('slug', e.target.value)} placeholder={t('admin.slug')} />
            </CardContent></Card>

            <Card><CardHeader><CardTitle>Featured Image</CardTitle></CardHeader><CardContent className="space-y-3">
              <Input value={form.featuredImage} onChange={e => handleChange('featuredImage', e.target.value)} placeholder="https://..." />
              <Button type="button" variant="outline" onClick={handleGenerateCover} disabled={generatingCover} className="w-full">
                {generatingCover ? 'Generating...' : 'Generate Cover with AI'}
              </Button>
              {form.featuredImage && <img src={form.featuredImage} alt="" className="mt-3 rounded-editorial w-full h-32 object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
            </CardContent></Card>
          </div>
        </div>
      </form>
    </div>
  );
}
