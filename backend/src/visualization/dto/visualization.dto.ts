import { Type } from 'class-transformer';
import { IsString, IsOptional, IsIn, IsInt, Min, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const SUPPORTED_VIZ_LOCALES = ['zh-CN', 'zh-TW', 'en', 'ja'] as const;

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

  @ApiPropertyOptional({ description: 'Output language', enum: SUPPORTED_VIZ_LOCALES })
  @IsOptional()
  @IsIn(SUPPORTED_VIZ_LOCALES)
  language?: string;
}

export class RefineVisualizationDto {
  @ApiProperty()
  @IsInt()
  visualizationId: number;

  @ApiProperty({ description: 'Feedback or edit instructions' })
  @IsString()
  feedback: string;

  @ApiPropertyOptional({ description: 'Output language', enum: SUPPORTED_VIZ_LOCALES })
  @IsOptional()
  @IsIn(SUPPORTED_VIZ_LOCALES)
  language?: string;
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

  @ApiPropertyOptional({ description: 'Output language', enum: SUPPORTED_VIZ_LOCALES })
  @IsOptional()
  @IsIn(SUPPORTED_VIZ_LOCALES)
  language?: string;
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

  @ApiPropertyOptional({ enum: ['createdAt', 'updatedAt', 'title', 'viewCount', 'interactCount', 'likesCount', 'version'] })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'title', 'viewCount', 'interactCount', 'likesCount', 'version'])
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: string;
}

// ─── Batch Operations ────────────────────────────────────────

export class BatchUpdateStatusDto {
  @ApiProperty({ description: 'Array of visualization IDs' })
  @IsArray()
  @IsInt({ each: true })
  ids: number[];

  @ApiProperty({ enum: ['draft', 'published'] })
  @IsIn(['draft', 'published'])
  status: string;
}

export class BatchDeleteDto {
  @ApiProperty({ description: 'Array of visualization IDs' })
  @IsArray()
  @IsInt({ each: true })
  ids: number[];
}

// ─── Version Management ──────────────────────────────────────

export class RestoreVersionDto {
  @ApiPropertyOptional({ description: 'Change note for the restored version' })
  @IsOptional()
  @IsString()
  changeNote?: string;
}

export class CompareVersionsDto {
  @ApiProperty()
  @IsInt()
  fromVersionId: number;

  @ApiProperty()
  @IsInt()
  toVersionId: number;
}

export class VersionListItem {
  id: number;
  version: number;
  changeNote: string;
  prompt: string;
  createdAt: Date;
  isCurrent: boolean;
}

// ─── Topic Suggestions ───────────────────────────────────────

export class TopicSuggestion {
  id: string;
  title: string;
  description: string;
  subject: 'math' | 'physics';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

export class SuggestTopicsDto {
  @ApiPropertyOptional({ enum: ['math', 'physics'] })
  @IsOptional()
  @IsIn(['math', 'physics'])
  subject?: string;

  @ApiPropertyOptional({ description: 'Number of topics to suggest' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  count?: number;
}

// ─── Article Mode ──────────────────────────────────────────────

export class UpdateArticleConfigDto {
  @ApiPropertyOptional({ description: 'Enable interactive article mode' })
  @IsOptional()
  articleMode?: boolean;

  @ApiPropertyOptional({ description: 'Quiz JSON string' })
  @IsOptional()
  @IsString()
  quiz?: string;
}

// ─── AI Tutor ──────────────────────────────────────────────────

export class AskTutorDto {
  @ApiProperty({ description: 'Session identifier (anonymous or user-based)' })
  @IsString()
  sessionId: string;

  @ApiProperty({ enum: ['param_change', 'button_click', 'question'] })
  @IsIn(['param_change', 'button_click', 'question'])
  interactionType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parameterName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parameterValue?: string;

  @ApiPropertyOptional({ description: 'Free-text question from user' })
  @IsOptional()
  @IsString()
  question?: string;

  @ApiPropertyOptional({ description: 'Output language', enum: SUPPORTED_VIZ_LOCALES })
  @IsOptional()
  @IsIn(SUPPORTED_VIZ_LOCALES)
  language?: string;
}

// ─── Classroom ─────────────────────────────────────────────────

export class CreateClassroomDto {
  @ApiProperty({ description: 'Classroom name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Visualization ID to share' })
  @IsInt()
  visualizationId: number;
}

export class JoinClassroomDto {
  @ApiProperty({ description: '6-character join code' })
  @IsString()
  joinCode: string;
}

// ─── Narration ─────────────────────────────────────────────────

export class GenerateNarrationDto {
  @ApiPropertyOptional({ description: 'Target locale', enum: SUPPORTED_VIZ_LOCALES })
  @IsOptional()
  @IsIn(SUPPORTED_VIZ_LOCALES)
  locale?: string;
}

// ─── Difficulty ────────────────────────────────────────────────

export class GenerateDifficultyDto {
  @ApiProperty({ description: 'Difficulty levels to generate' })
  @IsArray()
  @IsIn(['beginner', 'intermediate', 'advanced'], { each: true })
  levels: string[];

  @ApiPropertyOptional({ description: 'Output language', enum: SUPPORTED_VIZ_LOCALES })
  @IsOptional()
  @IsIn(SUPPORTED_VIZ_LOCALES)
  language?: string;
}

// ─── Experiments ───────────────────────────────────────────────

export class CreateExperimentDto {
  @ApiProperty({ description: 'Core concept to explain' })
  @IsString()
  concept: string;

  @ApiProperty({ enum: ['math', 'physics'] })
  @IsIn(['math', 'physics'])
  subject: string;

  @ApiPropertyOptional({ description: 'Number of perspectives to generate' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  perspectiveCount?: number;

  @ApiPropertyOptional({ description: 'Output language', enum: SUPPORTED_VIZ_LOCALES })
  @IsOptional()
  @IsIn(SUPPORTED_VIZ_LOCALES)
  language?: string;
}
