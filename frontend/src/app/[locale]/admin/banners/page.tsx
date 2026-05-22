'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { banners as bannersApi, ai as aiApi, posts as postsApi } from '@/lib/api';
import { toast } from 'sonner';
import { useConfirm } from '@/lib/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableBannerCard({ banner, isFirst, isLast, onMove, onEdit, onDelete }: {
  banner: any;
  isFirst: boolean;
  isLast: boolean;
  onMove: (id: number, direction: 'up' | 'down') => void;
  onEdit: (b: any) => void;
  onDelete: (id: number) => void;
}) {
  const t = useTranslations();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`relative overflow-hidden ${!banner.isActive ? 'opacity-60 hover:opacity-100' : ''}`}>
        <CardContent className="p-4 flex items-center gap-6 group">
          <div className={`absolute left-0 top-0 bottom-0 w-1 ${banner.isActive ? 'bg-tertiary' : 'bg-outline-variant'}`} />

          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => onMove(banner.id, 'up')} disabled={isFirst} className="!w-5 !h-5" title="Move up">
              <span className="material-symbols-outlined text-[16px]">keyboard_arrow_up</span>
            </Button>
            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-0.5 text-outline-variant/50 hover:text-outline-variant transition-colors select-none" title="Drag to reorder">
              <span className="material-symbols-outlined text-[20px]">drag_indicator</span>
            </button>
            <Button variant="ghost" size="icon" onClick={() => onMove(banner.id, 'down')} disabled={isLast} className="!w-5 !h-5" title="Move down">
              <span className="material-symbols-outlined text-[16px]">keyboard_arrow_down</span>
            </Button>
          </div>

          <div className="w-48 h-24 rounded-lg overflow-hidden border border-border shrink-0 bg-surface-container relative">
            <img src={banner.imageUrl} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" loading="lazy" />
          </div>

          <div className="flex-1 min-w-0 py-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-headline-md text-headline-md text-on-surface truncate">{banner.title || t('admin.bannerUntitled')}</h3>
              {banner.isActive ? (
                <Badge variant="outline" className="bg-tertiary/10 text-tertiary border-tertiary/20 shrink-0">Active</Badge>
              ) : (
                <Badge variant="outline" className="text-on-surface-variant shrink-0">{t('admin.bannerInactive')}</Badge>
              )}
              <Badge variant="outline" className="text-on-surface-variant shrink-0 text-[10px]">{banner.zone || 'hero'}</Badge>
            </div>
            {banner.subtitle && <p className="font-body-sm text-body-sm text-on-surface-variant truncate mt-1">{banner.subtitle}</p>}
            <div className="flex items-center gap-6 mt-3">
              <div className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px]">format_list_numbered</span>
                <span className="font-label-sm text-label-sm">{t('admin.bannerOrder', { order: banner.sortOrder })}</span>
              </div>
              {(banner.startDate || banner.endDate) && (
                <div className="flex items-center gap-1.5 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  <span className="font-label-sm text-label-sm">
                    {banner.startDate ? new Date(banner.startDate).toLocaleDateString() : '...'} — {banner.endDate ? new Date(banner.endDate).toLocaleDateString() : '...'}
                  </span>
                </div>
              )}
              {(banner.clickCount > 0) && (
                <div className="flex items-center gap-1.5 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[14px]">ads_click</span>
                  <span className="font-label-sm text-label-sm">{banner.clickCount}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => onEdit(banner)} title={t('common.edit')}>
              <span className="material-symbols-outlined text-[20px]">edit</span>
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button variant="ghost" size="icon" onClick={() => onDelete(banner.id)} title="Delete" className="text-outline-variant hover:text-error">
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminBannersPage() {
  const t = useTranslations();
  const { confirm } = useConfirm();
  const [banners, setBanners] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [aiProvider, setAiProvider] = useState('grok');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showPreview, setShowPreview] = useState(false);
  const [form, setForm] = useState({
    title: '', subtitle: '', imageUrl: '', linkUrl: '', postId: '', sortOrder: 0, isActive: true,
    zone: 'hero', startDate: '', endDate: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const filteredBanners = statusFilter === 'all'
    ? banners
    : banners.filter(b => statusFilter === 'active' ? b.isActive : !b.isActive);

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
    setForm({ title: '', subtitle: '', imageUrl: '', linkUrl: '', postId: '', sortOrder: 0, isActive: true, zone: 'hero', startDate: '', endDate: '' });
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
        toast.error(t('admin.bannerGenerateFailed'));
      }
    } catch (err: any) { toast.error(err.message || t('admin.bannerGenerateFailed')); }
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
        zone: form.zone,
      };
      if (form.postId && form.postId !== 'none') payload.postId = Number(form.postId);
      if (form.startDate) payload.startDate = new Date(form.startDate).toISOString();
      if (form.endDate) payload.endDate = new Date(form.endDate).toISOString();

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
      zone: banner.zone || 'hero',
      startDate: banner.startDate ? new Date(banner.startDate).toISOString().slice(0, 16) : '',
      endDate: banner.endDate ? new Date(banner.endDate).toISOString().slice(0, 16) : '',
    });
    setEditingId(banner.id);
    setShowForm(true);
  };

  const deleteBanner = async (id: number) => {
    const ok = await confirm({ title: t('admin.bannerDeleteTitle'), message: t('admin.bannerDeleteMessage'), confirmLabel: t('admin.bannerDeleteLabel'), variant: 'destructive' });
    if (!ok) return;
    await bannersApi.delete(id);
    fetchBanners();
  };

  const moveBanner = async (id: number, direction: 'up' | 'down') => {
    const list = filteredBanners;
    const idx = list.findIndex(b => b.id === id);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === list.length - 1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const current = list[idx];
    const swap = list[swapIdx];
    await Promise.all([
      bannersApi.update(current.id, { sortOrder: swap.sortOrder }),
      bannersApi.update(swap.id, { sortOrder: current.sortOrder }),
    ]);
    fetchBanners();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const list = filteredBanners;
    const oldIdx = list.findIndex(b => b.id === active.id);
    const newIdx = list.findIndex(b => b.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;

    const reordered = [...list];
    const [moved] = reordered.splice(oldIdx, 1);
    reordered.splice(newIdx, 0, moved);

    const updates = reordered.map((b, i) => {
      if (b.sortOrder !== i) return bannersApi.update(b.id, { sortOrder: i });
      return Promise.resolve();
    });
    await Promise.all(updates);
    fetchBanners();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-1">
            {t('admin.banners')}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Manage homepage hero banners and promotional slots.
          </p>
        </div>
        <Button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          {showForm ? t('common.cancel') : t('admin.bannerNew')}
        </Button>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-label-md text-label-md text-on-surface-variant">Status:</span>
            <div className="flex gap-2">
              {(['all', 'active', 'inactive'] as const).map(s => (
                <Badge
                  key={s}
                  variant="outline"
                  onClick={() => setStatusFilter(s)}
                  className={`cursor-pointer transition-colors ${
                    statusFilter === s
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                  }`}
                >
                  {s === 'all' ? t('admin.all') : s === 'active' ? t('admin.active') : t('admin.bannerInactive')}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">sort</span>
            <span className="font-label-md text-label-md text-on-surface-variant">{t('admin.sortByPriority')}</span>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      {showForm && (
        <Card>
          <CardContent className="p-6 animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                {editingId ? t('admin.bannerEditBanner') : t('admin.bannerNewBanner')}
              </h3>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
                <span className="material-symbols-outlined text-[16px]">{showPreview ? 'edit' : 'visibility'}</span>
                {showPreview ? t('common.edit') : t('admin.bannerPreview')}
              </Button>
            </div>
            <div className={`${showPreview ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}`}>
              <form onSubmit={handleSubmit} className="space-y-5">
              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-body-sm text-body-sm text-on-surface-variant mb-1.5">
                    {t('admin.bannerTitle')} *
                  </label>
                  <Input
                    value={form.title}
                    onChange={e => handleChange('title', e.target.value)}
                    placeholder={t('admin.bannerTitle')}
                    required
                  />
                </div>
                <div>
                  <label className="block font-body-sm text-body-sm text-on-surface-variant mb-1.5">
                    {t('admin.bannerSubtitle')}
                  </label>
                  <Input
                    value={form.subtitle}
                    onChange={e => handleChange('subtitle', e.target.value)}
                    placeholder={t('admin.bannerSubtitle')}
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block font-body-sm text-body-sm text-on-surface-variant mb-1.5">
                  {t('admin.bannerImageUrl')}
                </label>
                <div className="flex gap-2">
                  <Input
                    value={form.imageUrl}
                    onChange={e => handleChange('imageUrl', e.target.value)}
                    placeholder="https://..."
                    required
                    className="flex-1"
                  />
                  <Select value={aiProvider} onValueChange={setAiProvider}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grok">{t('admin.bannerProviderGrok')}</SelectItem>
                      <SelectItem value="cloudflare">{t('admin.bannerProviderCloudflare')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateImage}
                    disabled={generating}
                  >
                    <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                    {generating ? t('admin.bannerGenerating') : t('admin.bannerAIGenerate')}
                  </Button>
                </div>
                {form.imageUrl && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-border">
                    <img src={form.imageUrl} alt="" className="w-full h-32 object-cover" loading="lazy" />
                  </div>
                )}
              </div>

              {/* Link URL, Post Select, Sort Order */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-body-sm text-body-sm text-on-surface-variant mb-1.5">
                    {t('admin.bannerLinkUrl')}
                  </label>
                  <Input
                    value={form.linkUrl}
                    onChange={e => handleChange('linkUrl', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block font-body-sm text-body-sm text-on-surface-variant mb-1.5">
                    {t('admin.bannerLinkToPost')}
                  </label>
                  <Select value={form.postId || 'none'} onValueChange={v => handleChange('postId', v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('admin.bannerNoLink')}</SelectItem>
                      {posts.map(p => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block font-body-sm text-body-sm text-on-surface-variant mb-1.5">
                    {t('admin.bannerSortOrder')}
                  </label>
                  <Input
                    type="number"
                    value={form.sortOrder}
                    onChange={e => handleChange('sortOrder', Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={v => handleChange('isActive', v)}
                />
                <span className="font-body-sm text-body-sm text-on-surface-variant">{t('admin.bannerActive')} (force active)</span>
              </div>

              {/* Zone Selector */}
              <div>
                <label className="block font-body-sm text-body-sm text-on-surface-variant mb-1.5">
                  Zone
                </label>
                <Select value={form.zone} onValueChange={v => handleChange('zone', v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hero">Hero (main carousel)</SelectItem>
                    <SelectItem value="sidebar">Sidebar</SelectItem>
                    <SelectItem value="inline">Inline (between sections)</SelectItem>
                    <SelectItem value="footer">Footer (above footer)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Scheduling */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-label-sm text-label-sm text-on-surface-variant">
                    {t('admin.bannerStartDate') || 'Start Date'}
                  </label>
                  <Input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={e => handleChange('startDate', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-label-sm text-label-sm text-on-surface-variant">
                    {t('admin.bannerEndDate') || 'End Date'}
                  </label>
                  <Input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={e => handleChange('endDate', e.target.value)}
                  />
                </div>
              </div>

              {/* Submit + Cancel */}
              <div className="flex gap-3 pt-2">
                <Button type="submit">
                  <span className="material-symbols-outlined text-[18px]">{editingId ? 'save' : 'add_circle'}</span>
                  {editingId ? t('admin.bannerUpdate') : t('admin.bannerCreate')}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  <span className="material-symbols-outlined text-[18px]">close</span>
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
            {showPreview && (
              <div className="space-y-3">
                <h4 className="font-label-md text-label-md text-on-surface-variant">Desktop</h4>
                <div className="rounded-lg overflow-hidden border border-border bg-surface-container-low">
                  <div className="relative w-full" style={{ aspectRatio: '1920/400' }}>
                    {form.imageUrl ? (
                      <img src={form.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-surface-container-high">
                        <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end p-4">
                      <h3 className="font-headline-md text-headline-md text-white drop-shadow-lg">{form.title || t('admin.bannerUntitled')}</h3>
                      {form.subtitle && <p className="font-body-sm text-body-sm text-white/80 drop-shadow mt-1">{form.subtitle}</p>}
                    </div>
                  </div>
                </div>
                <h4 className="font-label-md text-label-md text-on-surface-variant mt-4">Mobile</h4>
                <div className="rounded-lg overflow-hidden border border-border bg-surface-container-low mx-auto" style={{ maxWidth: '375px' }}>
                  <div className="relative w-full" style={{ aspectRatio: '375/300' }}>
                    {form.imageUrl ? (
                      <img src={form.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-surface-container-high">
                        <span className="material-symbols-outlined text-3xl text-on-surface-variant/30">image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end p-3">
                      <h3 className="font-headline-sm text-headline-sm text-white drop-shadow-lg">{form.title || t('admin.bannerUntitled')}</h3>
                      {form.subtitle && <p className="font-body-xs text-body-xs text-white/80 drop-shadow mt-0.5">{form.subtitle}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-6 animate-pulse">
                <div className="w-1 self-stretch bg-surface-container-high/50 rounded-full" />
                <div className="flex flex-col items-center gap-1 w-6">
                  <div className="w-4 h-4 bg-surface-container-high/50 rounded" />
                  <div className="w-5 h-5 bg-surface-container-high/50 rounded" />
                  <div className="w-4 h-4 bg-surface-container-high/50 rounded" />
                </div>
                <div className="w-48 h-24 rounded-lg bg-surface-container-high/50 shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-3/4 bg-surface-container-high/50 rounded" />
                  <div className="h-4 w-1/2 bg-surface-container-high/50 rounded" />
                </div>
                <div className="flex gap-3">
                  <div className="w-9 h-9 bg-surface-container-high/50 rounded-full" />
                  <div className="w-px h-6 bg-surface-container-high/50" />
                  <div className="w-9 h-9 bg-surface-container-high/50 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : banners.length === 0 ? (
        /* Empty State */
        <Card>
          <CardContent className="text-center py-16">
            <span className="material-symbols-outlined text-[48px] text-outline-variant mb-4 inline-block">view_carousel</span>
            <p className="font-body-md text-body-md text-on-surface-variant">{t('admin.bannerNoBanners')}</p>
          </CardContent>
        </Card>
      ) : (
        /* Banners List */
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredBanners.map(b => b.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {filteredBanners.map((banner, i) => (
                <SortableBannerCard
                  key={banner.id}
                  banner={banner}
                  isFirst={i === 0}
                  isLast={i === filteredBanners.length - 1}
                  onMove={moveBanner}
                  onEdit={editBanner}
                  onDelete={deleteBanner}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
