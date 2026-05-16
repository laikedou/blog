import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UpdateSiteConfigDto {
  @IsString()
  @IsOptional()
  siteTitle?: string;

  @IsString()
  @IsOptional()
  siteTagline?: string;

  @IsString()
  @IsOptional()
  siteDescription?: string;

  @IsString()
  @IsOptional()
  adminTitle?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  faviconUrl?: string;

  @IsString()
  @IsOptional()
  footerText?: string;

  @IsString()
  @IsOptional()
  copyrightText?: string;

  @IsString()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  socialLinks?: string;

  @IsString()
  @IsOptional()
  seoHomeTitle?: string;

  @IsString()
  @IsOptional()
  seoHomeDescription?: string;

  @IsNumber()
  @IsOptional()
  postsPerPage?: number;

  @IsBoolean()
  @IsOptional()
  enableComments?: boolean;

  @IsString()
  @IsOptional()
  customHeadHtml?: string;

  @IsString()
  @IsOptional()
  privacyPolicyContent?: string;

  @IsString()
  @IsOptional()
  termsOfUseContent?: string;
}
