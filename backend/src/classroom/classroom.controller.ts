import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClassroomService } from './classroom.service';
import { LivekitService } from './livekit.service';
import { CreateClassroomDto, JoinClassroomDto } from './dto/classroom.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Classrooms')
@Controller('api/classrooms')
export class ClassroomController {
  constructor(private service: ClassroomService, private livekit: LivekitService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a classroom' })
  async create(@Body() dto: CreateClassroomDto, @Req() req: any) {
    return this.service.create(dto.name, dto.visualizationId, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get classroom details' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('join')
  @ApiOperation({ summary: 'Join a classroom by code' })
  async join(@Body() dto: JoinClassroomDto, @Req() req: any) {
    const classroom = await this.service.findByCode(dto.joinCode);
    // Actually join the student as a participant
    await this.service.join(classroom.id, req.user.id);
    return classroom;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/leave')
  @ApiOperation({ summary: 'Leave a classroom' })
  async leave(@Param('id') id: string, @Req() req: any) {
    return this.service.leave(+id, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete (end) a classroom' })
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.service.remove(+id, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/livekit-token')
  @ApiOperation({ summary: 'Get LiveKit access token for WebRTC' })
  async getLivekitToken(@Param('id') id: string, @Req() req: any) {
    const classroom = await this.service.findOne(+id);
    const participant = classroom.participants?.find((p: any) => p.userId === req.user.id);

    if (!participant) {
      throw new BadRequestException('You must join the classroom first');
    }

    if (!this.livekit.isConfigured()) {
      return { token: null, livekitUrl: '', roomName: '', canPublish: false, configured: false };
    }

    const roomName = `classroom-${classroom.id}`;
    const canPublish = participant.role === 'teacher';
    const token = await this.livekit.generateToken(
      roomName,
      req.user.username || `user-${req.user.id}`,
      canPublish,
    );

    return {
      token,
      livekitUrl: this.livekit.getLivekitUrl(),
      roomName,
      canPublish,
      configured: true,
    };
  }
}
