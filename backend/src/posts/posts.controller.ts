import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto, QueryPostDto } from './dto/posts.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Posts')
@Controller('api/posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Public()
  @Get()
  findAll(@Query() query: QueryPostDto) {
    return this.postsService.findAll(query);
  }

  @Public()
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.postsService.findBySlug(slug);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  create(@Body() dto: CreatePostDto, @CurrentUser() user) {
    return this.postsService.create(dto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePostDto) {
    return this.postsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.remove(id);
  }
}
