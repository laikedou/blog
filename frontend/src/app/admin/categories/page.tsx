'use client';

import { useState, useEffect } from 'react';
import { categories as categoriesApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/lib/confirm-dialog';

export default function AdminCategoriesPage() {
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
      toast.success(editing ? 'Category updated' : 'Category created');
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
    const ok = await confirm({ title: 'Delete Category', message: 'Delete this category? All posts in this category will become uncategorized.', confirmLabel: 'Delete', variant: 'destructive' });
    if (!ok) return;
    await categoriesApi.delete(id);
    toast.success('Category deleted');
    fetchCategories();
  };

  return (
    <div>
      <h1 className="font-display text-display-md text-ink mb-8">Categories</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>{editing ? 'Edit Category' : 'New Category'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Category name" required />
              <Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description" />
              <div className="flex items-center gap-3">
                <label className="relative cursor-pointer">
                  <input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="w-10 h-10 rounded-editorial-sm border-2 border-border cursor-pointer hover:scale-105 transition-transform shadow-sm" style={{ backgroundColor: form.color }} />
                </label>
                <span className="text-body-sm text-ink-muted font-mono">{form.color}</span>
                {['#c84b31', '#2563eb', '#059669', '#d97706', '#7c3aed'].map(c => (
                  <button key={c} type="button" onClick={() => setForm({...form, color: c})} className="w-6 h-6 rounded-full border-2 border-border hover:scale-110 transition-transform" style={{ backgroundColor: c }} aria-label={`Color ${c}`} />
                ))}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</Button>
                {editing && <Button type="button" variant="outline" onClick={() => { setEditing(null); setForm({ name: '', description: '', color: '#c84b31' }); }}>Cancel</Button>}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>All Categories</CardTitle></CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : (
              <>
                {categories.length > 5 && (
                  <div className="px-6 pt-4 pb-2">
                    <Input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search categories..."
                      className="h-9"
                    />
                  </div>
                )}
                {categories.filter((cat: any) => cat.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-body-sm text-ink-muted">
                      {searchQuery ? `No categories matching "${searchQuery}"` : 'No categories yet'}
                    </p>
                  </div>
                ) : (
                  categories
                    .filter((cat: any) => cat.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((cat: any, i: number, filtered: any[]) => (
                <div key={cat.id} className={`px-6 py-4 flex items-center justify-between hover:bg-cream-200/50 transition-colors ${i < filtered.length - 1 ? 'border-b border-border' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                    <div>
                      <p className="text-body text-ink">{cat.name}</p>
                      <p className="text-body-sm text-ink-muted">{cat.postCount || 0} posts</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(cat)}><Edit2 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(cat.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              ))
            )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
