import {
  Controller, Get, Post, Put, Delete, Param, Query, Body,
  ParseIntPipe, UseGuards, UseInterceptors, UploadedFile,
  BadRequestException, Res, Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';

import { MediaService } from './media.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  QueryMediaDto,
  CreateFolderDto,
  UpdateFolderDto,
  BatchDeleteDto,
  BatchMoveDto,
} from './dto/media.dto';

const uploadDir = join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@ApiTags('Media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/media')
export class MediaController {
  private readonly logger = new Logger(MediaController.name);

  constructor(private mediaService: MediaService) {}

  // ─── Media CRUD ──────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List media with filters' })
  findAll(@Query() query: QueryMediaDto) {
    return this.mediaService.findAll(query);
  }

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a file' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
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
  @ApiOperation({ summary: 'Delete a media file' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.mediaService.remove(id);
  }

  // ─── Batch Operations ───────────────────────────────────

  @Post('batch-delete')
  @ApiOperation({ summary: 'Batch delete media files' })
  batchDelete(@Body() dto: BatchDeleteDto) {
    return this.mediaService.batchDelete(dto.ids);
  }

  @Post('batch-download')
  @ApiOperation({ summary: 'Batch download media files as zip' })
  async batchDownload(@Body() dto: BatchDeleteDto, @Res() res: Response) {
    return this.mediaService.batchDownload(dto.ids, res);
  }

  @Post('batch-move')
  @ApiOperation({ summary: 'Batch move media files to a folder' })
  batchMove(@Body() dto: BatchMoveDto) {
    return this.mediaService.batchMove(dto.ids, dto.folderId);
  }

  // ─── Folder CRUD ────────────────────────────────────────

  @Get('folders')
  @ApiOperation({ summary: 'List all media folders' })
  findAllFolders() {
    return this.mediaService.findAllFolders();
  }

  @Post('folders')
  @ApiOperation({ summary: 'Create a folder' })
  createFolder(@Body() dto: CreateFolderDto) {
    return this.mediaService.createFolder(dto.name, dto.parentId);
  }

  @Put('folders/:id')
  @ApiOperation({ summary: 'Rename a folder' })
  updateFolder(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFolderDto) {
    return this.mediaService.updateFolder(id, dto.name);
  }

  @Delete('folders/:id')
  @ApiOperation({ summary: 'Delete a folder (files moved to uncategorized)' })
  deleteFolder(@Param('id', ParseIntPipe) id: number) {
    return this.mediaService.deleteFolder(id);
  }
}
