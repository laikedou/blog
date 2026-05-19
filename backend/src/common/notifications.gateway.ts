import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? [process.env.FRONTEND_URL || 'https://yourdomain.com'].filter(Boolean)
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private connectedClients = new Map<string, Socket>();

  handleConnection(client: Socket) {
    this.connectedClients.set(client.id, client);
    console.log(`[WS] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    console.log(`[WS] Client disconnected: ${client.id}`);
  }

  notifyArticleCrawled(data: {
    articleId: number;
    title: string;
    sourceName: string;
    sourceUrl: string;
    crawledAt: string;
    status: 'new' | 'updated';
  }) {
    this.server.emit('crawl:article', data);
  }

  notifyCrawlComplete(data: {
    sourceId: number;
    sourceName: string;
    results: { new: number; skipped: number; errors: number; autoPublished: number };
    completedAt: string;
  }) {
    this.server.emit('crawl:complete', data);
  }

  notifyCrawlStarted(data: {
    sourceId: number;
    sourceName: string;
    startedAt: string;
  }) {
    this.server.emit('crawl:started', data);
  }

  notifyCommentReply(data: {
    commentId: number;
    postId?: number;
    visualizationId?: number;
    replyAuthor: string;
    parentAuthorId: number;
    snippet: string;
  }) {
    this.server.emit('comment:reply', data);
  }

  get connectedCount() {
    return this.connectedClients.size;
  }
}
