'use client';

import { useRouter } from 'next/navigation';
import { VisualizationAICreator, AICreationResult } from '@/components/Visualizations/VisualizationAICreator';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CreateVisualizationPage() {
  const router = useRouter();

  const handleDone = (result: AICreationResult) => {
    toast.success(
      result.status === 'published'
        ? `"${result.title}" published!`
        : `"${result.title}" saved as draft`
    );
    router.push('/admin/visualizations');
  };

  return (
    <div>
      <Link
        href="/admin/visualizations"
        className="inline-flex items-center gap-1.5 text-body-sm text-ink-muted hover:text-ink transition-colors mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Visualizations
      </Link>

      <VisualizationAICreator onDone={handleDone} />
    </div>
  );
}
