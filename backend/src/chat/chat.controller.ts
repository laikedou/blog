import { Controller, Post, Get, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { LogMessageDto, SubmitFeedbackDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Chat')
@Controller('api/chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('log')
  logMessage(@Body() dto: LogMessageDto) {
    return this.chatService.logMessage(dto);
  }

  @Post('feedback')
  submitFeedback(@Body() dto: SubmitFeedbackDto) {
    return this.chatService.submitFeedback(dto);
  }

  @Post('search')
  searchPosts(@Body() body: { query: string; limit?: number }) {
    return this.chatService.searchPosts(body.query, body.limit || 5);
  }

  @Get('stats')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getStats() {
    return this.chatService.getStats();
  }

  @Get('feedback')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getFeedback(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.chatService.getFeedback(page ? +page : 1, limit ? +limit : 20);
  }

  @Put('feedback/:id/read')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  markFeedbackRead(@Param('id') id: string) {
    return this.chatService.markFeedbackRead(+id);
  }
}
