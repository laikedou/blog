'use client';

import { useTranslations } from 'next-intl';
import ConnectionStatus from './ConnectionStatus';
import type { ConnectionStatus as ConnStatus } from '@/hooks/useClassroomSocket';
import { Volume2 } from 'lucide-react';

interface Props {
  status: ConnStatus;
  teacherName: string;
  studentsCount: number;
  livekitEnabled?: boolean;
}

export default function ClassroomStudentView({ status, teacherName, studentsCount, livekitEnabled }: Props) {
  const t = useTranslations();

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="bg-surface/90 backdrop-blur-md border border-border rounded-xl px-4 py-3 shadow-lg flex items-center gap-4">
        <ConnectionStatus status={status} />
        <div className="text-body-sm text-ink-muted">
          <span className="font-medium text-ink">{teacherName}</span>
          {' · '}
          {studentsCount} {t('viz.classroom.students')}
        </div>
        {livekitEnabled && (
          <span className="flex items-center gap-1 text-caption-sm text-clay">
            <Volume2 className="h-3.5 w-3.5" />
            {t('viz.classroom.livekitReady')}
          </span>
        )}
      </div>
    </div>
  );
}
