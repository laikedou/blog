import { IsString, IsOptional, IsInt, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCommentDto {
  @ApiProperty({ example: 'Great post! Thanks for sharing.' })
  @IsString()
  @MinLength(1)
  content: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  postId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number;
}

export class UpdateCommentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}
