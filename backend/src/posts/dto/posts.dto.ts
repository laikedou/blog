import { IsString, IsOptional, IsArray, IsBoolean, MinLength, MaxLength, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ example: 'My First Blog Post' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'my-first-blog-post' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: '<p>Post content here</p>' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: 'A short excerpt...' })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  featuredImage?: string;

  @ApiPropertyOptional({ example: 'draft' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional({ example: [1, 2] })
  @IsOptional()
  @IsArray()
  tagIds?: number[];
}

export class UpdatePostDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  featuredImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  categoryId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  tagIds?: number[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seoTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seoDescription?: string;
}

export class QueryPostDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tagId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  authorId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
