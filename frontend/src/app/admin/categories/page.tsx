'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { categories as categoriesApi } from '@/lib/api';
import { toast } from 'sonner';
import { useConfirm } from '@/lib/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminCategoriesPage() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', description: '', color: '#c84b31' });
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const fetchCategories = () => {
    categoriesApi.list().then(setCategories).finally(() => setLoading(false));
  };
  useEffect(() => { fetchCategories(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await categoriesApi.update(editing.id, form);
      else await categoriesApi.create(form);
      toast.success(editing ? t('admin.categoryUpdated') : t('admin.categoryCreated'));
      setForm({ name: '', description: '', color: '#c84b31' });
      setEditing(null);
      fetchCategories();
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  };

  const handleEdit = (cat: any) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description, color: cat.color || '#c84b31' });
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: t('admin.deleteCategory'), message: t('admin.confirmDeleteCategory'), confirmLabel: t('common.delete'), variant: 'destructive' });
    if (!ok) return;
    await categoriesApi.delete(id);
    toast.success(t('admin.categoryDeleted'));
    fetchCategories();
  };

  const colorOptions = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6B7280', '#c84b31', '#2563eb', '#059669', '#d97706', '#7c3aed'];

  const filtered = categories.filter((cat: any) => cat.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div>
      <h1 className="font-headline-md text-headline-md text-on-surface mb-8">{t('admin.categories')}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
        {/* Left Column: Create/Edit Form */}
        <div className="lg:col-span-4">
          <Card>
            <CardContent className="p-container-padding">
              <h2 className="font-headline-md text-lg font-semibold text-on-surface mb-6">
                {editing ? t('admin.editCategory') : t('admin.newCategory')}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Category Name */}
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-2">
                    {t('admin.categoryNamePlaceholder')}
                  </label>
                  <Input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder={t('admin.categoryNamePlaceholder')}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-2">
                    {t('admin.categoryDescriptionPlaceholder')}
                  </label>
                  <Input
                    type="text"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder={t('admin.categoryDescriptionPlaceholder')}
                  />
                </div>

                {/* Color Picker */}
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-3">
                    {t('admin.colorLabel', { color: '' }).replace(/ $/, '')}
                  </label>
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Hidden color input for custom color selection */}
                    <label className="relative cursor-pointer">
                      <input
                        type="color"
                        value={form.color}
                        onChange={e => setForm({ ...form, color: e.target.value })}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div
                        className="w-8 h-8 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-surface-container cursor-pointer hover:scale-110 transition-all"
                        style={{ backgroundColor: form.color }}
                      />
                    </label>
                    {/* Preset color circles */}
                    {colorOptions.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm({ ...form, color: c })}
                        className={`w-6 h-6 rounded-full transition-all hover:scale-110 ${
                          form.color === c
                            ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface-container'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  {/* Selected color preview */}
                  <div className="mt-3 flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-md border border-border"
                      style={{ backgroundColor: form.color }}
                    />
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{form.color}</span>
                  </div>
                </div>

                {/* Submit / Cancel actions */}
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full mt-6"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {editing ? 'save' : 'add'}
                  </span>
                  {saving ? t('admin.saving') : editing ? t('admin.update') : t('admin.create')}
                </Button>

                {editing && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => {
                      setEditing(null);
                      setForm({ name: '', description: '', color: '#c84b31' });
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Category List */}
        <div className="lg:col-span-8">
          <Card className="overflow-hidden flex flex-col min-h-[600px]">
            {/* Header with title and search */}
            <div className="p-container-padding border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="font-headline-md text-lg font-semibold text-on-surface">
                {t('admin.allCategories')}
              </h2>
              {categories.length > 5 && (
                <div className="relative w-full sm:w-64">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">
                    search
                  </span>
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={t('admin.searchCategoriesPlaceholder')}
                    className="pl-10 rounded-full"
                  />
                </div>
              )}
            </div>

            {/* Category items */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className="h-12 w-full bg-surface-container-highest/50 animate-pulse rounded-lg"
                    />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-body-sm text-on-surface-variant">
                    {searchQuery
                      ? t('admin.noCategoriesMatch', { query: searchQuery })
                      : t('admin.noCategoriesYet')}
                  </p>
                </div>
              ) : (
                filtered.map((cat: any, i: number, arr: any[]) => (
                  <div
                    key={cat.id}
                    className={`group flex items-center justify-between p-4 transition-colors ${
                      i < arr.length - 1 ? 'border-b border-border' : ''
                    } hover:bg-white/5`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{
                          backgroundColor: cat.color || '#6B7280',
                          boxShadow: `0 0 8px ${cat.color || '#6B7280'}80`,
                        }}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-on-surface truncate">{cat.name}</p>
                        <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                          {t('admin.postCount', { count: cat.postCount || 0 })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(cat)}
                        className="text-on-surface-variant hover:text-primary"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(cat.id)}
                        className="text-on-surface-variant hover:text-error"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
