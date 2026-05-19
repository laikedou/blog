'use client';

import { useTranslation } from 'react-i18next';

type Status = 'connecting' | 'connected' | 'disconnected';

interface Props {
  status: Status;
}

export default function ConnectionStatus({ status }: Props) {
  const { t } = useTranslation();

  const config: Record<Status, { color: string; label: string }> = {
    connecting: { color: 'bg-yellow-400', label: t('viz.classroom.connecting') },
    connected: { color: 'bg-green-400', label: t('viz.classroom.connected') },
    disconnected: { color: 'bg-red-400', label: t('viz.classroom.disconnected') },
  };

  const { color, label } = config[status];

  return (
    <span className="inline-flex items-center gap-1.5 text-caption-sm text-ink-muted">
      <span className={`w-2 h-2 rounded-full ${color} ${status === 'connecting' ? 'animate-pulse' : ''}`} />
      {label}
    </span>
  );
}
