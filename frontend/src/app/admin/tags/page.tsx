'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { tags as tagsApi } from '@/lib/api';
import { toast } from 'sonner';
import { useConfirm } from '@/lib/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

const dotColors = [
  'bg-primary/80',
  'bg-tertiary/80',
  'bg-secondary/80',
  'bg-primary/40',
  'bg-on-surface-variant/40',
];

export default function AdminTagsPage() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTags = () => {
    tagsApi.list().then(setTags).finally(() => setLoading(false));
  };
  useEffect(() => { fetchTags(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing) await tagsApi.update(editing.id, { name });
      else await tagsApi.create({ name });
      toast.success(editing ? t('admin.tagUpdated') : t('admin.tagCreated'));
      setName(''); setEditing(null);
      fetchTags();
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  };

  const handleEdit = (tag: any) => { setEditing(tag); setName(tag.name); };
  const handleCancelEdit = () => { setEditing(null); setName(''); };
  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: t('admin.deleteTag'), message: t('admin.confirmDeleteTag'), confirmLabel: t('common.delete'), variant: 'destructive' });
    if (!ok) return;
    await tagsApi.delete(id);
    toast.success(t('admin.tagDeleted'));
    fetchTags();
  };

  const filtered = tags.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative">
      {/* Ambient background */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[350px] h-[350px] rounded-full bg-secondary/5 blur-[80px] pointer-events-none z-0" />

      {/* Page header */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-margin-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">{t('admin.tags')}</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{t('admin.manageTags') || 'Manage blog tags for better content organization.'}</p>
        </div>
        <div className="relative w-full md:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('admin.searchTagsPlaceholder')}
            className="pl-10"
          />
        </div>
      </div>

      {/* Grid: form (4 cols) + tags (8 cols) */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Form card */}
        <div className="lg:col-span-4">
          <Card>
            <CardContent className="p-container-padding flex flex-col gap-gutter">
              <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">{editing ? 'edit' : 'add_circle'}</span>
                {editing ? t('admin.editTag') : t('admin.newTag')}
              </h3>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="space-y-2">
                  <label className="font-label-sm text-label-sm text-on-surface-variant">
                    {t('admin.tagName') || 'Tag name'} <span className="text-error">*</span>
                  </label>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={t('admin.tagNamePlaceholder')}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={saving} className="flex-1">
                    {saving ? (
                      <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">{editing ? 'save' : 'add'}</span>
                        {editing ? t('admin.update') : t('admin.add')}
                      </>
                    )}
                  </Button>
                  {editing && (
                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                      {t('common.cancel')}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Tags cloud */}
        <div className="lg:col-span-8 flex flex-col">
          <Card className="flex-1">
            <CardContent className="p-container-padding flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
                <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">sell</span>
                  {t('admin.allTags')}
                  <span className="font-label-sm text-label-sm text-on-surface-variant bg-white/5 px-2 py-0.5 rounded-full ml-2">{tags.length}</span>
                </h3>
              </div>

              {/* Loading state */}
              {loading && (
                <div className="flex flex-wrap gap-3">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-9 w-28 bg-surface-container-highest/30 animate-pulse rounded-full" />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loading && filtered.length === 0 && (
                <div className="flex-1 flex items-center justify-center py-12">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">sell</span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-3">
                      {searchQuery ? t('admin.noTagsMatch', { query: searchQuery }) : t('admin.noTagsYet')}
                    </p>
                  </div>
                </div>
              )}

              {/* Tag cloud */}
              {!loading && filtered.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {filtered.map((tag: any, index: number) => (
                    <div
                      key={tag.id}
                      className="group relative flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-all duration-200 border border-border bg-surface/60"
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#afc6ff';
                        e.currentTarget.style.background = 'rgba(175, 198, 255, 0.1)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '';
                        e.currentTarget.style.background = '';
                      }}
                    >
                      <div className={`w-2 h-2 rounded-full ${dotColors[index % dotColors.length]}`} />
                      <span className="font-label-md text-label-md text-on-surface group-hover:text-primary transition-colors">#{tag.name}</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant/60">({tag.postCount || 0})</span>

                      {/* Hover-reveal action buttons */}
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface-container-high rounded-lg p-1 shadow-lg shadow-black/50 border border-border opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 pointer-events-none group-hover:pointer-events-auto z-10">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="!w-7 !h-7"
                          onClick={(e) => { e.stopPropagation(); handleEdit(tag); }}
                          title={t('common.edit')}
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="!w-7 !h-7"
                          onClick={(e) => { e.stopPropagation(); handleDelete(tag.id); }}
                          title={t('common.delete')}
                        >
                          <span className="material-symbols-outlined text-[16px] text-on-surface-variant hover:text-error">delete</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
