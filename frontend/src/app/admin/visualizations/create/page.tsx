'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { VisualizationAICreator, AICreationResult } from '@/components/Visualizations/VisualizationAICreator';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function CreateVisualizationPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const handleDone = (result: AICreationResult) => {
    toast.success(
      result.status === 'published'
        ? t('admin.createVizSuccessPublished', { title: result.title })
        : t('admin.createVizSuccessDraft', { title: result.title })
    );
    router.push('/admin/visualizations');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-surface border-b border-border">
        <div className="max-w-grid mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/visualizations"
              className="inline-flex items-center justify-center w-8 h-8 rounded-editorial-xs text-ink-muted hover:text-ink hover:bg-surface-hover transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="font-display text-display-sm text-ink leading-none">{t('admin.createVisualization')}</h1>
              <p className="text-caption-sm text-ink-muted mt-0.5">{t('admin.createVizSubtitle')}</p>
            </div>
          </div>
          <Link href="/admin/visualizations">
            <Button variant="outline" size="sm">{t('common.cancel')}</Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-grid mx-auto px-6 py-6">
        <VisualizationAICreator onDone={handleDone} />
      </div>
    </div>
  );
}
