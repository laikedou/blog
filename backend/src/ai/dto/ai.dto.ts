import { IsString, IsOptional, IsArray, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const SUPPORTED_LOCALES = ['zh-CN', 'zh-TW', 'en', 'ja'] as const;

export class GeneratePostDto {
  @ApiProperty({ example: 'The Future of Artificial Intelligence' })
  @IsString()
  topic: string;

  @ApiPropertyOptional({ example: 'technology' })
  @IsOptional()
  @IsString()
  style?: string;

  @ApiPropertyOptional({ example: 800 })
  @IsOptional()
  wordCount?: number;

  @ApiPropertyOptional({ example: ['AI', 'Technology', 'Future'] })
  @IsOptional()
  @IsArray()
  keywords?: string[];

  @ApiPropertyOptional({ example: 'zh-CN', enum: SUPPORTED_LOCALES })
  @IsOptional()
  @IsIn(SUPPORTED_LOCALES)
  language?: string;
}

export class EnhanceContentDto {
  @ApiProperty({ example: '<p>Some content to enhance...</p>' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: 'improve-grammar' })
  @IsOptional()
  @IsString()
  mode?: string; // improve-grammar | summarize | expand | translate | polish | rewrite

  @ApiPropertyOptional({ example: 'zh-CN', enum: SUPPORTED_LOCALES })
  @IsOptional()
  @IsIn(SUPPORTED_LOCALES)
  language?: string;
}

export class GenerateSeoDto {
  @ApiProperty({ example: 'My Blog Post Title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: '<p>Post content...</p>' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: 'zh-CN', enum: SUPPORTED_LOCALES })
  @IsOptional()
  @IsIn(SUPPORTED_LOCALES)
  language?: string;
}

export class SuggestTagsDto {
  @ApiProperty({ example: '<p>Post content about technology...</p>' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  maxTags?: number;
}

export class AiImagePromptDto {
  @ApiProperty({ example: 'A futuristic city with AI robots' })
  @IsString()
  postContent: string;

  @ApiPropertyOptional({ example: 'zh-CN', enum: SUPPORTED_LOCALES })
  @IsOptional()
  @IsIn(SUPPORTED_LOCALES)
  language?: string;
}

// ---- Crawl AI Analysis ----

export class AnalyzeListingPageDto {
  html: string;
  url: string;
}

export interface AnalyzeListingPageResult {
  totalArticles: number;
  currentPage: number;
  totalPages: number;
  paginationPattern: string | null;
}

export class RewriteArticleDto {
  title: string;
  content: string;
  excerpt: string;
  sourceName?: string;
}

export interface RewriteArticleResult {
  title: string;
  content: string;
  excerpt: string;
}
