import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BannersService } from './banners.service';
import { CreateBannerDto, UpdateBannerDto } from './dto/banners.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Banners')
@Controller('api/banners')
export class BannersController {
  constructor(private bannersService: BannersService) {}

  @Get()
  findAll() {
    return this.bannersService.findAll();
  }

  @Get('active')
  findActive() {
    return this.bannersService.findActive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bannersService.findOne(+id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateBannerDto) {
    return this.bannersService.create(dto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.bannersService.update(+id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.bannersService.remove(+id);
  }
}
