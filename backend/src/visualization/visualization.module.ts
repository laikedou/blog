import { Module } from '@nestjs/common';
import { VisualizationController } from './visualization.controller';
import { VisualizationService } from './visualization.service';
import { VisualizationAiService } from './visualization-ai.service';
import { GrokTtsService } from './grok-tts.service';
import { PrismaModule } from '../common/prisma.module';
import { AiUsageModule } from '../ai-usage/ai-usage.module';

@Module({
  imports: [PrismaModule, AiUsageModule],
  controllers: [VisualizationController],
  providers: [VisualizationService, VisualizationAiService, GrokTtsService],
  exports: [VisualizationService, VisualizationAiService],
})
export class VisualizationModule {}
