import { IsString, IsOptional, IsInt, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditPostDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  postId: number;
}

export class TrackKeywordDto {
  @ApiProperty({ example: 'artificial intelligence' })
  @IsString()
  keyword: string;

  @ApiPropertyOptional({ example: 'manual' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsInt()
  volume?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  difficulty?: number;
}

export class RecordKeywordRankingDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  keywordId: number;

  @ApiProperty({ example: 3 })
  @IsOptional()
  @IsInt()
  position?: number;

  @ApiProperty({ example: '/posts/my-article' })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ example: 'google' })
  @IsOptional()
  @IsString()
  source?: string;
}

export class RecordClickDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  postId?: number;

  @ApiProperty({ example: '/posts/my-article' })
  @IsString()
  pageUrl: string;

  @ApiPropertyOptional({ example: 'google' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  clicks?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  impressions?: number;

  @ApiPropertyOptional({ example: 0.1 })
  @IsOptional()
  @IsNumber()
  ctr?: number;

  @ApiPropertyOptional({ example: 3.5 })
  @IsOptional()
  @IsNumber()
  avgPosition?: number;
}

export class UpdateIndexStatusDto {
  @ApiProperty({ example: '/posts/my-article' })
  @IsString()
  pageUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  googleIndexed?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  baiduIndexed?: boolean;

  @ApiPropertyOptional({ example: '[]' })
  @IsOptional()
  @IsString()
  errors?: string;
}
