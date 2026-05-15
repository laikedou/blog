import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { CreateTagDto, UpdateTagDto } from './dto/tags.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Tags')
@Controller('api/tags')
export class TagsController {
  constructor(private tagsService: TagsService) {}

  @Public()
  @Get()
  findAll() {
    return this.tagsService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tagsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  create(@Body() dto: CreateTagDto) {
    return this.tagsService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTagDto) {
    return this.tagsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tagsService.remove(id);
  }
}
