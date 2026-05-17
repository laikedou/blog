import { Controller, Get, Headers, Ip, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { I18nService } from './i18n.service';
import { Request } from 'express';

@ApiTags('i18n')
@Controller('api/i18n')
export class I18nController {
  constructor(private readonly i18nService: I18nService) {}

  @Get('detect')
  @ApiOperation({ summary: 'Detect user locale from IP and Accept-Language header' })
  async detect(@Req() req: Request, @Ip() ip: string, @Headers('accept-language') acceptLanguage?: string) {
    const forwarded = (req.headers['x-forwarded-for'] as string) || ip;
    const clientIp = forwarded.split(',')[0].trim();

    const locale = await this.i18nService.detectLocale(clientIp, acceptLanguage);
    return { locale, supportedLocales: ['zh-CN', 'zh-TW', 'en', 'ja'] };
  }
}
