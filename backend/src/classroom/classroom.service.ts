import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ClassroomService {
  private readonly logger = new Logger(ClassroomService.name);

  constructor(private prisma: PrismaService) {}

  private generateJoinCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  async create(name: string, visualizationId: number, teacherId: number) {
    const joinCode = this.generateJoinCode();

    const classroom = await this.prisma.classroom.create({
      data: {
        name,
        joinCode,
        visualizationId,
        teacherId,
      },
      include: { visualization: { select: { id: true, title: true } } },
    });

    // Add teacher as participant
    await this.prisma.classroomParticipant.create({
      data: { classroomId: classroom.id, userId: teacherId, role: 'teacher' },
    });

    return { ...classroom, participantCount: 1 };
  }

  async findByCode(joinCode: string) {
    const c = await this.prisma.classroom.findUnique({
      where: { joinCode: joinCode.toUpperCase() },
      include: {
        visualization: { select: { id: true, title: true, htmlContent: true, subject: true } },
        participants: {
          include: { user: { select: { id: true, username: true, displayName: true, avatar: true } } },
        },
      },
    });
    if (!c) throw new NotFoundException('Classroom not found');
    if (c.status !== 'active') throw new BadRequestException('Classroom has ended');
    return c;
  }

  async findOne(id: number) {
    const c = await this.prisma.classroom.findUnique({
      where: { id },
      include: {
        visualization: { select: { id: true, title: true, htmlContent: true, subject: true } },
        participants: {
          include: { user: { select: { id: true, username: true, displayName: true, avatar: true } } },
        },
      },
    });
    if (!c) throw new NotFoundException('Classroom not found');
    return c;
  }

  async join(classroomId: number, userId: number) {
    const existing = await this.prisma.classroomParticipant.findUnique({
      where: { classroomId_userId: { classroomId, userId } },
    });
    if (existing) {
      await this.prisma.classroomParticipant.update({
        where: { id: existing.id },
        data: { lastActiveAt: new Date() },
      });
      return existing;
    }
    return this.prisma.classroomParticipant.create({
      data: { classroomId, userId, role: 'student' },
    });
  }

  async leave(classroomId: number, userId: number) {
    const participant = await this.prisma.classroomParticipant.findUnique({
      where: { classroomId_userId: { classroomId, userId } },
    });
    if (!participant) return { left: false };
    await this.prisma.classroomParticipant.delete({ where: { id: participant.id } });
    return { left: true };
  }

  async end(classroomId: number, teacherId: number) {
    const c = await this.prisma.classroom.findUnique({ where: { id: classroomId } });
    if (!c) throw new NotFoundException('Classroom not found');
    if (c.teacherId !== teacherId) throw new BadRequestException('Only the teacher can end the classroom');
    return this.prisma.classroom.update({ where: { id: classroomId }, data: { status: 'ended' } });
  }

  async remove(classroomId: number, teacherId: number) {
    const c = await this.prisma.classroom.findUnique({ where: { id: classroomId } });
    if (!c) throw new NotFoundException('Classroom not found');
    if (c.teacherId !== teacherId) throw new BadRequestException('Only the teacher can delete the classroom');
    await this.prisma.classroom.delete({ where: { id: classroomId } });
    return { deleted: true };
  }
}
