import { Type } from 'class-transformer';
import { IsString, IsOptional, IsIn, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateVisualizationDto {
  @ApiProperty({ description: 'Topic prompt for the AI' })
  @IsString()
  prompt: string;

  @ApiProperty({ enum: ['math', 'physics'] })
  @IsIn(['math', 'physics'])
  subject: string;

  @ApiPropertyOptional({ description: 'AI provider to use' })
  @IsOptional()
  @IsIn(['gemini', 'grok', 'deepseek', 'openai', 'claude'])
  provider?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;
}

export class RefineVisualizationDto {
  @ApiProperty()
  @IsInt()
  visualizationId: number;

  @ApiProperty({ description: 'Feedback or edit instructions' })
  @IsString()
  feedback: string;
}

export class CreateVisualizationDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ enum: ['math', 'physics'] })
  @IsIn(['math', 'physics'])
  subject: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  introduction?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  detailedExplanation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  knowledgeSummary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiProperty()
  @IsString()
  htmlContent: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prompt?: string;
}

export class UpdateVisualizationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  introduction?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  detailedExplanation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  knowledgeSummary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  htmlContent?: string;

  @ApiPropertyOptional({ enum: ['draft', 'published'] })
  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: string;
}

export class PublishVisualizationDto {
  @ApiProperty({ enum: ['draft', 'published'] })
  @IsIn(['draft', 'published'])
  status: string;
}

export class FixErrorDto {
  @ApiProperty()
  @IsInt()
  visualizationId: number;

  @ApiProperty({ description: 'The compilation or runtime error message to fix' })
  @IsString()
  error: string;
}

export class QueryVisualizationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['math', 'physics'] })
  @IsOptional()
  @IsIn(['math', 'physics'])
  subject?: string;

  @ApiPropertyOptional({ enum: ['draft', 'published'] })
  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: string;
}
