import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateBannerDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  imageUrl: string;

  @IsString()
  @IsOptional()
  linkUrl?: string;

  @IsNumber()
  @IsOptional()
  postId?: number;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateBannerDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  linkUrl?: string;

  @IsNumber()
  @IsOptional()
  postId?: number;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
