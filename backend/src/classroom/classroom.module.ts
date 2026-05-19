import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ClassroomController } from './classroom.controller';
import { ClassroomService } from './classroom.service';
import { ClassroomGateway } from './classroom.gateway';
import { LivekitService } from './livekit.service';
import { PrismaModule } from '../common/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'blog-jwt-secret-key-change-in-production',
    }),
  ],
  controllers: [ClassroomController],
  providers: [ClassroomService, ClassroomGateway, LivekitService],
  exports: [ClassroomService],
})
export class ClassroomModule {}
