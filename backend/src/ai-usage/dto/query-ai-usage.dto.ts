import { IsOptional, IsString, IsInt, Min, IsDateString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAiUsageDto {
  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  page?: number = 1;

  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  limit?: number = 20;

  @IsOptional() @IsString()
  provider?: string;

  @IsOptional() @IsString()
  model?: string;

  @IsOptional() @IsString()
  feature?: string;

  @IsOptional() @IsString()
  @IsIn(['success', 'error'])
  status?: string;

  @IsOptional() @IsDateString()
  startDate?: string;

  @IsOptional() @IsDateString()
  endDate?: string;
}
