import { Module } from '@nestjs/common';
import { CrawlController } from './crawl.controller';
import { CrawlService } from './crawl.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [CrawlController],
  providers: [CrawlService],
})
export class CrawlModule {}
