import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SiteConfigService } from './site-config.service';
import { UpdateSiteConfigDto } from './dto/site-config.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Site Config')
@Controller('api/site-config')
export class SiteConfigController {
  constructor(private siteConfigService: SiteConfigService) {}

  @Get()
  getConfig() {
    return this.siteConfigService.getConfig();
  }

  @Put()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  updateConfig(@Body() dto: UpdateSiteConfigDto) {
    return this.siteConfigService.updateConfig(dto);
  }
}
