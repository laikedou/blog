import { Module } from '@nestjs/common';
import { ExperimentController } from './experiment.controller';
import { ExperimentService } from './experiment.service';
import { PrismaModule } from '../common/prisma.module';
import { VisualizationModule } from '../visualization/visualization.module';

@Module({
  imports: [PrismaModule, VisualizationModule],
  controllers: [ExperimentController],
  providers: [ExperimentService],
})
export class ExperimentModule {}
