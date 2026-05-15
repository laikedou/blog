import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}

export class EnhanceContentDto {
  @ApiProperty({ example: '<p>Some content to enhance...</p>' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: 'improve-grammar' })
  @IsOptional()
  @IsString()
  mode?: string; // improve-grammar | summarize | expand | translate | polish | rewrite
}

export class GenerateSeoDto {
  @ApiProperty({ example: 'My Blog Post Title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: '<p>Post content...</p>' })
  @IsOptional()
  @IsString()
  content?: string;
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
