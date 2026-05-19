import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto, BatchUpdateStatusDto } from './dto/comments.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Comments')
@Controller('api/comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Public()
  @Get('post/:postId')
  findByPost(@Param('postId', ParseIntPipe) postId: number) {
    return this.commentsService.findByPost(postId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  findAll(
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number,
    @Query('status') status?: string,
  ) {
    return this.commentsService.findAll(page, limit, status);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  create(@Body() dto: CreateCommentDto, @CurrentUser() user) {
    return this.commentsService.create(dto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCommentDto) {
    return this.commentsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.commentsService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('batch-update-status')
  @ApiOperation({ summary: 'Batch update comment statuses' })
  batchUpdateStatus(@Body() dto: BatchUpdateStatusDto) {
    return this.commentsService.batchUpdateStatus(dto.ids, dto.status);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/like')
  toggleLike(@Param('id', ParseIntPipe) id: number, @CurrentUser() user) {
    return this.commentsService.toggleLike(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id/like-status')
  getLikeStatus(@Param('id', ParseIntPipe) id: number, @CurrentUser() user) {
    return this.commentsService.getLikeStatus(id, user.id);
  }
}
