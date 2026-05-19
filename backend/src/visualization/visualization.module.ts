import { Module } from '@nestjs/common';
import { VisualizationController } from './visualization.controller';
import { VisualizationService } from './visualization.service';
import { VisualizationAiService } from './visualization-ai.service';
import { AzureTtsService } from './azure-tts.service';
import { EdgeTtsService } from './edge-tts.service';
import { PrismaModule } from '../common/prisma.module';
import { AiUsageModule } from '../ai-usage/ai-usage.module';

@Module({
  imports: [PrismaModule, AiUsageModule],
  controllers: [VisualizationController],
  providers: [VisualizationService, VisualizationAiService, AzureTtsService, EdgeTtsService],
  exports: [VisualizationService, VisualizationAiService],
})
export class VisualizationModule {}
