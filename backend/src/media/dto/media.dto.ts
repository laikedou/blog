import { Type } from 'class-transformer';
import { IsString, IsOptional, IsInt, Min, IsArray, IsDateString, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QueryMediaDto {
  @ApiPropertyOptional({ description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ description: 'Search by original filename' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by mime type (e.g. image, application)' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ description: 'Filter by folder ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  folderId?: number;

  @ApiPropertyOptional({ description: 'Include files with no folder (when folderId not set)' })
  @IsOptional()
  @IsString()
  @IsIn(['true', 'false'])
  uncategorized?: string;

  @ApiPropertyOptional({ description: 'Start date (ISO string)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date (ISO string)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Sort field', default: 'createdAt' })
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'size', 'originalName'])
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', default: 'desc' })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: string;
}

export class CreateFolderDto {
  @ApiProperty({ description: 'Folder name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Parent folder ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number;
}

export class UpdateFolderDto {
  @ApiProperty({ description: 'Folder name' })
  @IsString()
  name: string;
}

export class BatchDeleteDto {
  @ApiProperty({ description: 'Array of media IDs to delete' })
  @IsArray()
  @IsInt({ each: true })
  ids: number[];
}

export class BatchMoveDto {
  @ApiProperty({ description: 'Array of media IDs to move' })
  @IsArray()
  @IsInt({ each: true })
  ids: number[];

  @ApiPropertyOptional({ description: 'Target folder ID (null to uncategorize)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  folderId?: number | null;
}
