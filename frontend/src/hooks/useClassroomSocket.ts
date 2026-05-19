'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

interface UseClassroomSocketOptions {
  classroomId: number;
  joinCode: string;
}

export function useClassroomSocket({ classroomId, joinCode }: UseClassroomSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [students, setStudents] = useState<any[]>([]);
  const [teacherEvent, setTeacherEvent] = useState<any>(null);

  useEffect(() => {
    // Don't connect if no valid classroom
    if (!classroomId || !joinCode) {
      setStatus('disconnected');
      return;
    }

    const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || '';
    const token = localStorage.getItem('token');
    setStatus('connecting');
    const socket = io(`${SOCKET_URL}/classroom`, {
      transports: ['websocket', 'polling'],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus('connected');
      socket.emit('room:join', { roomId: classroomId, joinCode });
    });

    socket.on('disconnect', () => setStatus('disconnected'));

    socket.on('teacher:sync', (data: any) => {
      setTeacherEvent(data);
    });

    socket.on('student:joined', (data: any) => {
      setStudents((prev) => {
        if (prev.find((s) => s.userId === data.userId)) return prev;
        return [...prev, { userId: data.userId, displayName: data.displayName, isTeacher: data.isTeacher }];
      });
    });

    socket.on('student:left', (data: any) => {
      setStudents((prev) => prev.filter((s) => s.userId !== data.userId));
    });

    socket.on('students:update', (data: { students: any[] }) => {
      setStudents(data.students);
    });

    socket.on('error', (data: any) => {
      console.error('Classroom error:', data.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [classroomId, joinCode]);

  const sendTeacherSync = useCallback((eventType: string, payload: any) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('teacher:sync', { roomId: classroomId, eventType, payload });
  }, [classroomId]);

  const sendStudentState = useCallback((state: any) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('student:state', { roomId: classroomId, state });
  }, [classroomId]);

  return { status, students, teacherEvent, sendTeacherSync, sendStudentState };
}
