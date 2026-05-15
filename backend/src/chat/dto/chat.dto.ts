import { IsString, IsOptional, IsArray } from 'class-validator';

export class LogMessageDto {
  @IsString()
  sessionId: string;

  @IsString()
  role: string;

  @IsString()
  content: string;
}

export class SubmitFeedbackDto {
  @IsString()
  sessionId: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  pageUrl?: string;
}

export class SearchPostsDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
