'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth';
import { classrooms } from '@/lib/api';
import { HtmlVisualizationRenderer } from '@/components/Visualizations/VisualizationRenderer';
import { useClassroomSocket } from '@/hooks/useClassroomSocket';
import { useLivekitClassroom } from '@/hooks/useLivekitClassroom';
import ClassroomStudentView from '@/components/Visualizations/ClassroomStudentView';
import ClassroomAudioOverlay from '@/components/Visualizations/ClassroomAudioOverlay';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function ClassroomJoinPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const { user, isAuthenticated } = useAuth();
  const code = Array.isArray(params.code) ? params.code[0] : params.code;

  const [loading, setLoading] = useState(true);
  const [classroom, setClassroom] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    classrooms.join(code.toUpperCase())
      .then((c) => { setClassroom(c); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [code]);

  const socketData = classroom ? {
    classroomId: classroom.id,
    joinCode: code?.toUpperCase() || '',
  } : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-200 flex items-center justify-center">
        <Skeleton className="h-[500px] w-full max-w-2xl rounded-xl" />
      </div>
    );
  }

  if (error || !classroom) {
    return (
      <div className="min-h-screen bg-cream-200 flex items-center justify-center">
        <Card className="p-12 text-center max-w-md">
          <Users className="h-16 w-16 mx-auto mb-4 text-ink-faint" />
          <h2 className="font-display text-display-md text-ink mb-2">{t('viz.classroom.notFound')}</h2>
          <p className="text-body-sm text-ink-muted mb-6">{error || t('viz.classroom.notFoundDesc')}</p>
          <Button onClick={() => router.push('/visualizations')}>
            {t('viz.browseAll')}
          </Button>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream-200 flex items-center justify-center">
        <Card className="p-12 text-center max-w-md">
          <Sparkles className="h-16 w-16 mx-auto mb-4 text-clay" />
          <h2 className="font-display text-display-md text-ink mb-2">{t('viz.classroom.signIn')}</h2>
          <p className="text-body-sm text-ink-muted mb-6">{t('viz.classroom.signInDesc')}</p>
          <Button onClick={() => router.push(`/login?redirect=/classroom/${code}`)}>
            {t('nav.signIn')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-200">
      <JoinContent
        classroom={classroom}
        socketData={socketData!}
      />
    </div>
  );
}

function JoinContent({ classroom, socketData }: {
  classroom: any;
  socketData: NonNullable<any>;
}) {
  const t = useTranslations();
  const { status, students, teacherEvent, sendStudentState } = useClassroomSocket(socketData);
  const { config: livekitConfig } = useLivekitClassroom(classroom.id);

  const teacher = classroom.participants?.find((p: any) => p.role === 'teacher');

  return (
    <>
      <div className="max-w-grid mx-auto px-6 py-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-display-lg text-ink">{classroom.name}</h1>
            <p className="text-body-sm text-ink-muted">
              {t('viz.classroom.hostedBy')}: {teacher?.user?.displayName || t('viz.classroom.teacherFallback')}
            </p>
          </div>
          <ClassroomStudentView
            status={status}
            teacherName={teacher?.user?.displayName || t('viz.classroom.teacherFallback')}
            studentsCount={students.length + 1}
            livekitEnabled={livekitConfig?.configured}
          />
        </div>

        <ClassroomAudioOverlay config={livekitConfig}>
          <Card className="border-border shadow-card overflow-hidden">
            <div className="bg-white relative min-h-[500px]">
              <HtmlVisualizationRenderer
                htmlContent={classroom.visualization?.htmlContent || ''}
                visualizationId={classroom.visualizationId}
                onInteraction={(payload) => {
                  sendStudentState({ lastInteraction: payload });
                }}
                externalEvent={teacherEvent?.payload || null}
              />
            </div>
          </Card>
        </ClassroomAudioOverlay>
      </div>
    </>
  );
}
