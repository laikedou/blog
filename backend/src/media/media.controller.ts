import { Controller, Get, Post, Delete, Param, Query, ParseIntPipe, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';

const uploadDir = join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@ApiTags('Media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/media')
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Get()
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.mediaService.findAll(page, limit);
  }

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, cb) => {
        const allowed = /\.(jpg|jpeg|png|gif|webp|svg|mp4|pdf|doc|docx)$/i;
        if (allowed.test(extname(file.originalname))) {
          cb(null, true);
        } else {
          cb(new BadRequestException('File type not allowed'), false);
        }
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File, @CurrentUser() user) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.mediaService.create(file, user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.mediaService.remove(id);
  }
}
