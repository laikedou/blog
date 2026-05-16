import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { PostsModule } from '../posts/posts.module';
import { AiUsageModule } from '../ai-usage/ai-usage.module';

@Module({
  imports: [PostsModule, AiUsageModule],
  providers: [AiService],
  controllers: [AiController],
  exports: [AiService],
})
export class AiModule {}
