import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { CategoriesModule } from './categories/categories.module';
import { TagsModule } from './tags/tags.module';
import { CommentsModule } from './comments/comments.module';
import { MediaModule } from './media/media.module';
import { AiModule } from './ai/ai.module';
import { CrawlModule } from './crawl/crawl.module';
import { StatsModule } from './stats/stats.module';
import { ChatModule } from './chat/chat.module';
import { BannersModule } from './banners/banners.module';
import { HealthModule } from './health/health.module';
import { SeoModule } from './seo/seo.module';
import { VisualizationModule } from './visualization/visualization.module';
import { LogsModule } from './logs/logs.module';
import { AiUsageModule } from './ai-usage/ai-usage.module';
import { SiteConfigModule } from './site-config/site-config.module';
import { CloudflareAiModule } from './common/cloudflare-ai.module';
import { GrokImageModule } from './common/grok-image.module';
import { NotificationsModule } from './common/notifications.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 60,
    }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    PostsModule,
    CategoriesModule,
    TagsModule,
    CommentsModule,
    MediaModule,
    AiModule,
    CrawlModule,
    StatsModule,
    ChatModule,
    BannersModule,
    HealthModule,
    SeoModule,
    VisualizationModule,
    LogsModule,
    AiUsageModule,
    SiteConfigModule,
    CloudflareAiModule,
    GrokImageModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
