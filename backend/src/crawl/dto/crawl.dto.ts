import { IsString, IsInt, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCrawlSourceDto {
  @ApiProperty({ example: 'My Blog' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'https://example.com/blog' })
  @IsString()
  url: string;

  @ApiProperty({ example: 60, description: 'Interval in minutes' })
  @Type(() => Number)
  @IsInt()
  @Min(10)
  interval: number;
}

export class UpdateCrawlSourceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10)
  interval?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class CrawlSourceResponse {
  id: number;
  name: string;
  url: string;
  interval: number;
  status: string;
  lastRunAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { articles: number };
}
