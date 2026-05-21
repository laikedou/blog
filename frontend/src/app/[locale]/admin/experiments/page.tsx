'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { experiments } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layers, Trash2, Plus, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminExperimentsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [concept, setConcept] = useState('');
  const [subject, setSubject] = useState('physics');
  const [perspectiveCount, setPerspectiveCount] = useState(3);

  const fetchData = () => {
    setLoading(true);
    experiments.list()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!concept.trim()) return;
    setCreating(true);
    try {
      const result = await experiments.create({
        concept: concept.trim(),
        subject,
        perspectiveCount,
        language: locale,
      });
      toast.success(t('admin.experimentsCreated'));
      setConcept('');
      router.push(`/experiments/${result.id}`);
    } catch {
      toast.error(t('admin.experimentsCreateFailed'));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('admin.experimentsDeleteConfirm'))) return;
    try {
      await experiments.remove(id);
      toast.success(t('admin.experimentsDeleted'));
      setData((prev) => prev.filter((e) => e.id !== id));
    } catch {
      toast.error(t('admin.experimentsDeleteFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FlaskConical className="h-6 w-6 text-clay" />
        <h1 className="font-display text-display-md text-ink">{t('viz.experiment.title')}</h1>
      </div>

      {/* Create form */}
      <Card className="border-border">
        <CardContent className="p-5 space-y-4">
          <h2 className="font-display text-display-xs text-ink">{t('admin.experimentsGenerateTitle')}</h2>
          <p className="text-body-sm text-ink-muted">
            {t('admin.experimentsGenerateDesc')}
          </p>
          <div className="flex flex-wrap gap-3">
            <Input
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder={t('admin.experimentsConceptPlaceholder')}
              className="flex-1 min-w-[240px]"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="physics">{t('viz.physicsLabel')}</SelectItem>
                <SelectItem value="math">{t('viz.mathematics')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(perspectiveCount)} onValueChange={(v) => setPerspectiveCount(Number(v))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">{t('admin.experimentsPerspectives', { count: 2 })}</SelectItem>
                <SelectItem value="3">{t('admin.experimentsPerspectives', { count: 3 })}</SelectItem>
                <SelectItem value="4">{t('admin.experimentsPerspectives', { count: 4 })}</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleCreate} disabled={creating || !concept.trim()}>
              {creating ? t('admin.experimentsGenerating') : <><Plus className="h-4 w-4 mr-1" /> {t('admin.experimentsCreateBtn')}</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing experiments */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-16">
          <Layers className="h-12 w-12 mx-auto mb-3 text-ink-faint" />
          <p className="text-body text-ink-muted">{t('viz.experiment.empty')}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((exp) => (
            <Card key={exp.id} className="border-border hover:shadow-card transition-shadow cursor-pointer" onClick={() => router.push(`/experiments/${exp.id}`)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-display-xs text-ink mb-1">{exp.title}</h3>
                    <p className="text-body-sm text-ink-muted mb-2">{exp.description}</p>
                    <span className="text-caption-sm text-ink-muted">{t('admin.experimentsPerspectives', { count: exp.perspectives?.length || 0 })}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(exp.id); }}>
                    <Trash2 className="h-4 w-4 text-ink-muted hover:text-red-500" />
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
