'use client';

import { useState, useEffect } from 'react';
import { classrooms } from '@/lib/api';

export interface LivekitConfig {
  token: string;
  livekitUrl: string;
  roomName: string;
  canPublish: boolean;
  configured: boolean;
}

export function useLivekitClassroom(classroomId: number | null) {
  const [config, setConfig] = useState<LivekitConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classroomId) {
      setConfig(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    classrooms.getLivekitToken(classroomId)
      .then((result) => {
        if (cancelled) return;
        if (result.configured === false) {
          setConfig({ token: '', livekitUrl: '', roomName: '', canPublish: false, configured: false });
        } else {
          setConfig({
            token: result.token,
            livekitUrl: result.livekitUrl,
            roomName: result.roomName,
            canPublish: result.canPublish,
            configured: true,
          });
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || 'Failed to get LiveKit token');
        setConfig({ token: '', livekitUrl: '', roomName: '', canPublish: false, configured: false });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [classroomId]);

  return { config, loading, error };
}
