import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClassroomService } from './classroom.service';

interface StudentState {
  userId: number;
  displayName: string;
  state: any;
  lastActiveAt: string;
}

@WebSocketGateway({
  cors: {
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  },
  namespace: '/classroom',
})
export class ClassroomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ClassroomGateway.name);
  private studentStates = new Map<string, Map<number, StudentState>>();

  constructor(
    private readonly classroomService: ClassroomService,
    private readonly jwtService: JwtService,
  ) {}

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (token) {
        const payload = this.jwtService.verify(token);
        (client as any).userId = payload.sub;
        (client as any).username = payload.username;
        (client as any).role = payload.role;
        this.logger.log(`Client authenticated: userId=${payload.sub}, socket=${client.id}`);
      }
    } catch {
      this.logger.warn(`Client connected without valid token: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    for (const room of client.rooms) {
      if (room.startsWith('classroom:')) {
        const classroomId = parseInt(room.split(':')[1]);
        const userId = (client as any).userId;
        if (userId) {
          this.studentStates.get(room)?.delete(userId);
          this.server.to(room).emit('student:left', { userId });
        }
      }
    }
  }

  @SubscribeMessage('room:join')
  async handleRoomJoin(
    @MessageBody() data: { roomId: number; joinCode: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = (client as any).userId;
      if (!userId) {
        client.emit('error', { message: 'Authentication required' });
        return;
      }

      const classroom = await this.classroomService.findByCode(data.joinCode);
      if (classroom.id !== data.roomId) {
        client.emit('error', { message: 'Invalid classroom' });
        return;
      }

      await this.classroomService.join(classroom.id, userId);
      const displayName = (client as any).username || `User ${userId}`;

      const room = `classroom:${data.roomId}`;
      client.join(room);
      (client as any).classroomId = data.roomId;

      const isTeacher = classroom.teacherId === userId;
      if (isTeacher) {
        (client as any).isTeacher = true;
        if (!this.studentStates.has(room)) {
          this.studentStates.set(room, new Map());
        }
      }

      this.server.to(room).emit('student:joined', {
        userId,
        displayName,
        isTeacher,
      });
    } catch (error: any) {
      client.emit('error', { message: error.message || 'Failed to join classroom' });
    }
  }

  @SubscribeMessage('room:leave')
  handleRoomLeave(
    @MessageBody() data: { roomId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `classroom:${data.roomId}`;
    client.leave(room);
    const userId = (client as any).userId;
    if (userId) {
      this.studentStates.get(room)?.delete(userId);
      this.server.to(room).emit('student:left', { userId });
    }
  }

  @SubscribeMessage('teacher:sync')
  handleTeacherSync(
    @MessageBody() data: { roomId: number; eventType: string; payload: any },
    @ConnectedSocket() client: Socket,
  ) {
    if (!(client as any).isTeacher) {
      client.emit('error', { message: 'Only teacher can sync' });
      return;
    }
    const room = `classroom:${data.roomId}`;
    client.to(room).emit('teacher:sync', {
      eventType: data.eventType,
      payload: data.payload,
      timestamp: Date.now(),
    });
  }

  @SubscribeMessage('student:state')
  handleStudentState(
    @MessageBody() data: { roomId: number; state: any },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = (client as any).userId;
    if (!userId) return;

    const room = `classroom:${data.roomId}`;
    if (!this.studentStates.has(room)) {
      this.studentStates.set(room, new Map());
    }
    const displayName = (client as any).username || `User ${userId}`;
    this.studentStates.get(room)!.set(userId, {
      userId,
      displayName,
      state: data.state,
      lastActiveAt: new Date().toISOString(),
    });

    const students = Array.from(this.studentStates.get(room)!.values());
    for (const [, socket] of this.server.sockets.sockets) {
      if ((socket as any).isTeacher && socket.rooms.has(room)) {
        socket.emit('students:update', { students });
      }
    }
  }
}
