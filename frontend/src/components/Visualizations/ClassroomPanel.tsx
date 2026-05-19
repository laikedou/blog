'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Users, Copy, X, ExternalLink, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { useLivekitClassroom } from '@/hooks/useLivekitClassroom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { ConnectionStatus } from '@/hooks/useClassroomSocket';

interface StudentInfo {
  userId: number;
  displayName: string;
  state?: any;
  lastActiveAt?: string;
}

interface Props {
  classroomId: number;
  classroomName: string;
  joinCode: string;
  students: StudentInfo[];
  connectionStatus: ConnectionStatus;
  onEnd: () => void;
}

export default function ClassroomPanel({
  classroomId,
  classroomName,
  joinCode,
  students,
  connectionStatus,
  onEnd,
}: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { config, loading: livekitLoading } = useLivekitClassroom(classroomId);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  const joinLink = typeof window !== 'undefined'
    ? `${window.location.origin}/classroom/${joinCode}`
    : '';

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(joinLink);
    toast.success(t('viz.linkCopied'));
  };

  const handleOpenClassroom = () => {
    router.push(`/classroom/${joinCode}`);
  };

  const statusColors: Record<string, string> = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500',
    disconnected: 'bg-red-500',
  };

  return (
    <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex flex-col items-center justify-between px-5 py-4 border-b border-border bg-surface-container-lowest/50">
        <div className="flex items-center gap-3">
          <div className={`h-2.5 w-2.5 rounded-full ${statusColors[connectionStatus] || statusColors.disconnected}`} />
          <div>
            <h3 className="font-display text-display-xs text-ink">{classroomName}</h3>
            <p className="text-caption-sm text-ink-muted">
              {t('viz.classroom.code')}: <span className="font-mono font-bold tracking-widest select-all">{joinCode}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {config?.configured && (
            <>
              <button
                onClick={() => setMicMuted(!micMuted)}
                className={`p-1.5 rounded-lg transition-colors ${micMuted ? 'bg-red-100 text-red-600' : 'text-ink-muted hover:text-ink'}`}
                title={micMuted ? t('viz.classroom.micMuted') : t('viz.classroom.micOn')}
              >
                {micMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setCameraOff(!cameraOff)}
                className={`p-1.5 rounded-lg transition-colors ${cameraOff ? 'bg-red-100 text-red-600' : 'text-ink-muted hover:text-ink'}`}
                title={cameraOff ? t('viz.classroom.cameraOff') : t('viz.classroom.cameraOff')}
              >
                {cameraOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              </button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={handleCopyLink} title={t('viz.classroom.copyLinkBtn')}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleOpenClassroom} title={t('viz.classroom.openClassroom')}>
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onEnd} className="text-red-500 hover:text-red-600">
            <X className="h-4 w-4 mr-1" /> {t('viz.classroom.end')}
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* LiveKit status */}
        {livekitLoading ? (
          <p className="text-caption-sm text-ink-muted">{t('common.loading')}...</p>
        ) : config?.configured ? (
          <div className="flex items-center gap-2 text-caption-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            {t('viz.classroom.livekitReady')}
          </div>
        ) : (
          <p className="text-caption-sm text-ink-muted bg-surface-container-highest rounded-lg px-3 py-2">
            {t('viz.classroom.livekitNotConfigured')}
          </p>
        )}

        {/* Students list */}
        <div>
          <h4 className="text-label-sm font-label-sm text-ink mb-2 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {t('viz.classroom.students')} ({students.length})
          </h4>
          {students.length === 0 ? (
            <p className="text-caption-sm text-ink-muted">{t('viz.classroom.waiting')}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {students.map((s) => (
                <div key={s.userId} className="bg-surface-container-highest rounded-lg px-3 py-2 text-body-sm text-ink truncate">
                  {s.displayName || `User #${s.userId}`}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
