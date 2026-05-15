import { Global, Module } from '@nestjs/common';
import { CloudflareAiService } from './cloudflare-ai.service';

@Global()
@Module({
  providers: [CloudflareAiService],
  exports: [CloudflareAiService],
})
export class CloudflareAiModule {}
