'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { posts as postsApi, categories as categoriesApi, tags as tagsApi, ai as aiApi } from '@/lib/api';
import AITools from '@/components/AITools';
import FloatingAIMenu from '@/components/FloatingAIMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const RichEditor = dynamic(() => import('@/components/RichEditor'), { ssr: false });

export default function EditPostPage() {
  const { id } = useParams();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFullTools, setShowFullTools] = useState(false);
  const [orbLeft, setOrbLeft] = useState(24);
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
    // Re-check after a short delay in case layout shifts
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
        title: post.title, content: post.content, excerpt: post.excerpt, slug: post.slug,
        status: post.status, categoryId: post.category?.id?.toString() || '',
        tagIds: post.tags?.map((t: any) => t.id) || [],
        featuredImage: post.featuredImage || '', seoTitle: post.seoTitle || '',
        seoDescription: post.seoDescription || '',
      });
      setCategories(cats); setAllTags(tgs);
    }).finally(() => setLoading(false));
  }, [id]);

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
    if (!form.title.trim()) { alert('Please enter a title first'); return; }
    setGeneratingCover(true);
    try {
      const { url } = await aiApi.generateCover({ title: form.title, excerpt: form.excerpt });
      handleChange('featuredImage', url);
    } catch (err: any) { alert(err.message || 'Failed to generate cover'); }
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
      if (form.categoryId) payload.categoryId = Number(form.categoryId); else payload.categoryId = null;
      if (form.featuredImage) payload.featuredImage = form.featuredImage;
      await postsApi.update(Number(id), payload);
      router.push('/admin/posts');
    } catch (err: any) { alert(err.message); }
    setSaving(false);
  };

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-[34px] w-48" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><Skeleton className="h-96 w-full rounded-editorial" /></div>
        <div className="space-y-4"><Skeleton className="h-32 w-full rounded-editorial" /><Skeleton className="h-24 w-full rounded-editorial" /></div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-display-md text-ink">Edit Post</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card ref={editorRef} className="p-6">
              <Input value={form.title} onChange={e => handleChange('title', e.target.value)} placeholder="Post title" className="font-display text-display-md border-0 border-b-2 border-border rounded-none px-0 pb-3 mb-6 shadow-none focus-visible:ring-0" required />
              <RichEditor value={form.content} onChange={val => handleChange('content', val)} placeholder="Write your post content here..." />
            </Card>
          </div>

          <div className="space-y-4">
            <Card><CardHeader><CardTitle>Publish</CardTitle></CardHeader><CardContent className="space-y-3">
              <select value={form.status} onChange={e => handleChange('status', e.target.value)} className="flex h-11 w-full rounded-editorial-sm border border-border bg-surface px-4 py-2.5 text-body">
                <option value="draft">Draft</option><option value="published">Published</option>
              </select>
              <Button type="submit" disabled={saving} className="w-full">{saving ? 'Saving...' : 'Update'}</Button>
            </CardContent></Card>

            <Card><CardHeader><CardTitle>Category</CardTitle></CardHeader><CardContent>
              <select value={form.categoryId} onChange={e => handleChange('categoryId', e.target.value)} className="flex h-11 w-full rounded-editorial-sm border border-border bg-surface px-4 py-2.5 text-body">
                <option value="">Uncategorized</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </CardContent></Card>

            <Card><CardHeader><CardTitle>Tags</CardTitle></CardHeader><CardContent>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map(tag => (
                  <Badge key={tag.id} variant={form.tagIds.includes(tag.id) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => toggleTag(tag.id)}>{tag.name}</Badge>
                ))}
              </div>
            </CardContent></Card>

            <Card><CardHeader><CardTitle>SEO</CardTitle></CardHeader><CardContent className="space-y-3">
              <Input value={form.seoTitle} onChange={e => handleChange('seoTitle', e.target.value)} placeholder="SEO Title" />
              <Textarea value={form.seoDescription} onChange={e => handleChange('seoDescription', e.target.value)} placeholder="SEO Description" rows={2} />
              <Input value={form.slug} onChange={e => handleChange('slug', e.target.value)} placeholder="Slug" />
            </CardContent></Card>

            <Card><CardHeader><CardTitle>Featured Image</CardTitle></CardHeader><CardContent className="space-y-3">
              <Input value={form.featuredImage} onChange={e => handleChange('featuredImage', e.target.value)} placeholder="https://..." />
              <Button type="button" variant="outline" onClick={handleGenerateCover} disabled={generatingCover} className="w-full">
                {generatingCover ? 'Generating...' : 'Generate Cover with AI'}
              </Button>
              {form.featuredImage && <img src={form.featuredImage} alt="" className="mt-3 rounded-editorial w-full h-32 object-cover" />}
            </CardContent></Card>
          </div>
        </div>
      </form>

      {/* Full AI Tools modal (controlled by FloatingAIMenu) */}
      <AITools
        onGenerate={handleAIGenerate}
        currentContent={form.content}
        currentTitle={form.title}
        isOpen={showFullTools}
        onClose={() => setShowFullTools(false)}
      />

      {/* Floating AI orb - always visible on screen */}
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
