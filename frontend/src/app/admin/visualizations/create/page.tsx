'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { VisualizationAICreator, AICreationResult } from '@/components/Visualizations/VisualizationAICreator';
import Link from 'next/link';
import { toast } from 'sonner';

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
      <div
        className="sticky top-0 z-30 border-b border-white/5"
        style={{
          background: 'rgba(11, 19, 38, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/visualizations"
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </Link>
            <div>
              <h1 className="font-headline-md text-headline-md text-on-surface leading-none">{t('admin.createVisualization')}</h1>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">{t('admin.createVizSubtitle')}</p>
            </div>
          </div>
          <Link
            href="/admin/visualizations"
            className="bg-transparent border border-white/20 text-on-surface hover:bg-white/5 rounded-lg px-4 py-2 text-label-sm font-label-sm transition-all"
          >
            {t('common.cancel')}
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <VisualizationAICreator onDone={handleDone} />
      </div>
    </div>
  );
}
