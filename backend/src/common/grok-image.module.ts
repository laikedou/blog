import { Module, Global } from '@nestjs/common';
import { GrokImageService } from './grok-image.service';

@Global()
@Module({
  providers: [GrokImageService],
  exports: [GrokImageService],
})
export class GrokImageModule {}
