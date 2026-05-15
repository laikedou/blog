import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({ example: 'JavaScript' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ example: 'javascript' })
  @IsOptional()
  @IsString()
  slug?: string;
}

export class UpdateTagDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;
}
