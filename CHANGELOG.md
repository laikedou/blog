# Changelog

## 2026-05-19

### Features
- **Streaming AI Refine** — Visualization edit page AI Refine now uses SSE streaming: code area shows real-time token-by-token output as the AI refines, with live preview updating on completion. Added `POST /api/visualizations/refine-stream` endpoint with full SSE lifecycle (init/chunk/done/error), abort support, and client disconnect handling

## 2026-05-17

### i18n Internationalization
- **Full i18n translation** — All frontend components migrated to use `react-i18next` with translation keys across 4 locales (en, zh-CN, zh-TW, ja)
- **17 components translated**: AITools, BannerCarousel, ChatBot, DashboardCharts, FloatingAIMenu, SelectionAIToolbar, Header, Footer, NotificationBell, PostCard, ImageActionsDialog, MediaPickerDialog, LanguageSwitcher, and all Visualizations components (VisualizationRenderer, VisualizationLikeButton, RelatedVisualizations, VisualizationStats, VisualizationComments, VisualizationAICreator)
- **New i18n keys** — Added ~100+ translation keys across `common`, `admin`, `viz`, `chat`, and `errors` namespaces
- **Admin pages translated** — All 15+ admin pages including visualizations, logs, AI usage, settings, posts, categories, tags, comments, media, banners, SEO, crawl, and chat analytics
- **Public pages translated** — Home, login, register, post detail, category, tag, visualization gallery, and privacy policy pages

### Features
- **AI Usage Tracking** — New backend module (`ai-usage`) and admin page for monitoring API consumption across providers
- **Data Visualizations** — Full visualization system with AI-powered chart generation (bar, line, pie, area, scatter, radar, treemap). Includes backend service with multiple AI provider support and SSE streaming, public gallery, admin management, and stats page
- **System Logs** — Backend logging module with admin audit log viewer
- **Site Configuration** — Dynamic site-wide settings management with admin UI
- **Privacy & Terms Pages** — Public privacy policy and terms of use pages
- **Custom Head Injection** — `CustomHeadInjector` component for per-page head tags
- **UI Components** — New `switch` component (Radix UI)
- **Custom Hooks** — `use-site-config` hook and `confirm-dialog` utility

### Enhancements
- **AI Module** — Provider expansion: added Anthropic (`@ai-sdk/anthropic`), Google (`@ai-sdk/google`), xAI (`@ai-sdk/xai`) support alongside existing DeepSeek. Added `GrokImageService` for image generation. Chat history management, system prompts, and enhanced conversation handling
- **API Client** — Extended with visualization, logs, site-config, and AI-usage endpoints
- **Type System** — Added comprehensive type definitions for visualizations, logs, AI usage, site config, and chat
- **Admin Layout** — Restructured sidebar navigation with new entries for Visualizations, Logs, AI Usage, and Settings
- **Admin Pages** — Enhanced banners, categories, comments, media, posts, SEO, and tags management with improved CRUD operations
- **Banner Carousel** — Auto-play with dot navigation and swipe support
- **ChatBot** — UI improvements, markdown rendering with `react-markdown`, error handling, and provider configuration
- **Footer** — Links to privacy policy and terms of use
- **Header** — Responsive mobile menu with improved navigation
- **PostCard** — Enhanced image and layout handling
- **Image Actions** — Improved dialog UX
- **UI Polish** — Consistent styling across admin pages
- **Tailwind Config** — Extended with animation utilities
- **E2E Tests** — Comprehensive backend test suite covering all modules

### Infrastructure
- **Prisma Schema** — Added models for `AiUsage`, `Visualization`, `SystemLog`, `SiteConfig`, and `ChatHistory`. Added `description` field to `Tag` model
- **Environment** — Updated `.env.example` with new configuration variables
- **Dependencies** — Updated backend and frontend package locks

### Bug Fixes
- HTTP exception filter improvements for consistent error responses
- Various test updates and fixes
