'use client';

import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import type { LivekitConfig } from '@/hooks/useLivekitClassroom';

interface Props {
  config: LivekitConfig | null;
  children?: React.ReactNode;
}

export default function ClassroomAudioOverlay({ config, children }: Props) {
  if (!config?.configured || !config.token) return <>{children}</>;

  return (
    <LiveKitRoom
      token={config.token}
      serverUrl={config.livekitUrl}
      connect={true}
      audio={true}
      video={false}
    >
      <RoomAudioRenderer />
      {children}
    </LiveKitRoom>
  );
}
