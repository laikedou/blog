import { Injectable, Logger } from '@nestjs/common';
import { AccessToken } from 'livekit-server-sdk';

@Injectable()
export class LivekitService {
  private readonly logger = new Logger(LivekitService.name);

  async generateToken(roomName: string, participantName: string, canPublish: boolean): Promise<string> {
    const apiKey = process.env.LIVEKIT_API_KEY!;
    const apiSecret = process.env.LIVEKIT_API_SECRET!;

    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish,
      canSubscribe: true,
    });

    return await at.toJwt();
  }

  isConfigured(): boolean {
    return !!(
      process.env.LIVEKIT_API_KEY &&
      process.env.LIVEKIT_API_SECRET &&
      process.env.LIVEKIT_URL
    );
  }

  getLivekitUrl(): string {
    return process.env.LIVEKIT_URL || '';
  }
}
