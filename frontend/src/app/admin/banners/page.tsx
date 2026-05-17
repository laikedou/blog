'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { banners as bannersApi, ai as aiApi, posts as postsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Sparkles, Trash2, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/lib/confirm-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminBannersPage() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [banners, setBanners] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [aiProvider, setAiProvider] = useState('grok');
  const [form, setForm] = useState({
    title: '', subtitle: '', imageUrl: '', linkUrl: '', postId: '', sortOrder: 0, isActive: true,
  });

  const fetchBanners = () => {
    setLoading(true);
    Promise.all([
      bannersApi.list(),
      postsApi.list({ status: 'published', limit: 50 }),
    ]).then(([bannersData, postsData]) => {
      setBanners(bannersData);
      setPosts(postsData.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchBanners(); }, []);

  const handleChange = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const resetForm = () => {
    setForm({ title: '', subtitle: '', imageUrl: '', linkUrl: '', postId: '', sortOrder: 0, isActive: true });
    setEditingId(null);
    setShowForm(false);
    setAiProvider('grok');
  };

  const handleGenerateImage = async () => {
    if (!form.title.trim()) { toast.error(t('admin.bannerEnterTitle')); return; }
    setGenerating(true);
    try {
      const { url } = await aiApi.generateBanner({
        title: form.title,
        subtitle: form.subtitle,
        height: 400,
        provider: aiProvider,
      });
      if (url) {
        handleChange('imageUrl', url);
        toast.success(`Image generated via ${aiProvider === 'grok' ? t('admin.bannerProviderGrok') : t('admin.bannerProviderCloudflare')}`);
      } else {
        toast.error('Image generation returned no URL. Try the other provider.');
      }
    } catch (err: any) { toast.error(err.message || 'Failed to generate banner image'); }
    setGenerating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        title: form.title,
        subtitle: form.subtitle,
        imageUrl: form.imageUrl,
        linkUrl: form.linkUrl,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      };
      if (form.postId && form.postId !== 'none') payload.postId = Number(form.postId);

      if (editingId) {
        await bannersApi.update(editingId, payload);
      } else {
        await bannersApi.create(payload);
      }
      resetForm();
      fetchBanners();
    } catch (err: any) { toast.error(err.message); }
  };

  const editBanner = (banner: any) => {
    setForm({
      title: banner.title, subtitle: banner.subtitle, imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl, postId: banner.postId?.toString() || '',
      sortOrder: banner.sortOrder, isActive: banner.isActive,
    });
    setEditingId(banner.id);
    setShowForm(true);
  };

  const deleteBanner = async (id: number) => {
    const ok = await confirm({ title: 'Delete Banner', message: 'Delete this banner permanently?', confirmLabel: 'Delete', variant: 'destructive' });
    if (!ok) return;
    await bannersApi.delete(id);
    fetchBanners();
  };

  const moveBanner = async (id: number, direction: 'up' | 'down') => {
    const idx = banners.findIndex(b => b.id === id);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === banners.length - 1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const current = banners[idx];
    const swap = banners[swapIdx];
    await Promise.all([
      bannersApi.update(current.id, { sortOrder: swap.sortOrder }),
      bannersApi.update(swap.id, { sortOrder: current.sortOrder }),
    ]);
    fetchBanners();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-display-md text-ink">{t('admin.banners')}</h1>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>
          <Plus className="h-4 w-4 mr-2" /> {showForm ? t('common.cancel') : t('admin.bannerNew')}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8 border-clay/20">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-sm text-ink-soft mb-1.5">{t('admin.bannerTitle')} *</label>
                  <Input value={form.title} onChange={e => handleChange('title', e.target.value)} placeholder={t('admin.bannerTitle')} required />
                </div>
                <div>
                  <label className="block text-body-sm text-ink-soft mb-1.5">{t('admin.bannerSubtitle')}</label>
                  <Input value={form.subtitle} onChange={e => handleChange('subtitle', e.target.value)} placeholder={t('admin.bannerSubtitle')} />
                </div>
              </div>

              <div>
                <label className="block text-body-sm text-ink-soft mb-1.5">{t('admin.bannerImageUrl')}</label>
                <div className="flex gap-2">
                  <Input value={form.imageUrl} onChange={e => handleChange('imageUrl', e.target.value)} placeholder="https://..." className="flex-1" required />
                  <select
                    value={aiProvider}
                    onChange={e => setAiProvider(e.target.value)}
                    className="h-9 rounded-editorial-sm border border-border bg-surface px-3 text-body-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay"
                  >
                    <option value="grok">{t('admin.bannerProviderGrok')}</option>
                    <option value="cloudflare">{t('admin.bannerProviderCloudflare')}</option>
                  </select>
                  <Button type="button" variant="outline" onClick={handleGenerateImage} disabled={generating}>
                    <Sparkles className="h-4 w-4 mr-2" />{generating ? t('admin.bannerGenerating') : t('admin.bannerAIGenerate')}
                  </Button>
                </div>
                {form.imageUrl && (
                  <img src={form.imageUrl} alt="" className="mt-3 rounded-editorial w-full h-32 object-cover" loading="lazy" />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-body-sm text-ink-soft mb-1.5">{t('admin.bannerLinkUrl')}</label>
                  <Input value={form.linkUrl} onChange={e => handleChange('linkUrl', e.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-body-sm text-ink-soft mb-1.5">{t('admin.bannerLinkToPost')}</label>
                  <Select value={form.postId} onValueChange={val => handleChange('postId', val)}>
                    <SelectTrigger><SelectValue placeholder={t('admin.bannerNoLink')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('admin.bannerNoLink')}</SelectItem>
                      {posts.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-body-sm text-ink-soft mb-1.5">{t('admin.bannerSortOrder')}</label>
                  <Input type="number" value={form.sortOrder} onChange={e => handleChange('sortOrder', Number(e.target.value))} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('isActive', !form.isActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-clay/30 ${form.isActive ? 'bg-teal' : 'bg-cream-300'}`}
                  role="switch"
                  aria-checked={form.isActive}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-body-sm text-ink-soft">{t('admin.bannerActive')}</span>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit">{editingId ? t('admin.bannerUpdate') : t('admin.bannerCreate')}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>{t('common.cancel')}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-editorial" />)}
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-16 bg-surface rounded-editorial border border-border">
          <p className="text-body text-ink-muted">{t('admin.bannerNoBanners')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner, i) => (
            <Card key={banner.id} className={`border-border ${!banner.isActive ? 'opacity-50' : ''}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex flex-col gap-1 text-ink-muted">
                  <button onClick={() => moveBanner(banner.id, 'up')} disabled={i === 0} className="hover:text-ink disabled:opacity-30">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => moveBanner(banner.id, 'down')} disabled={i === banners.length - 1} className="hover:text-ink disabled:opacity-30">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <img src={banner.imageUrl} alt="" className="w-48 h-24 object-cover rounded-editorial-sm shrink-0" loading="lazy" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-body font-medium text-ink truncate">{banner.title || t('admin.bannerUntitled')}</p>
                    {!banner.isActive && <Badge variant="outline">{t('admin.bannerInactive')}</Badge>}
                  </div>
                  {banner.subtitle && <p className="text-body-sm text-ink-muted truncate">{banner.subtitle}</p>}
                  <p className="text-caption text-ink-muted mt-1">{t('admin.bannerOrder', { order: banner.sortOrder })}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => editBanner(banner)}>{t('common.edit')}</Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteBanner(banner.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
