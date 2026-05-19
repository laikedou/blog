# Changelog

## 2026-05-20 — UI Enhancement

### Features
- **Streaming AI Refine** — Visualization edit page AI Refine now uses SSE streaming: code area shows real-time token-by-token output as the AI refines, with live preview updating on completion. Added `POST /api/visualizations/refine-stream` endpoint with full SSE lifecycle (init/chunk/done/error), abort support, and client disconnect handling
- **Classroom Module** — Real-time teacher-student sync via WebRTC/LiveKit. Includes `ClassroomGateway` (WebSocket), `ClassroomService`, `LivekitService`, and classroom controller. Teacher can broadcast parameter changes, students receive them in real-time
- **Classroom UI** — `ClassroomPanel` for teacher controls, `ClassroomStudentView` for student side, `ClassroomAudioOverlay` for live audio, and `ConnectionStatus` indicator. Classroom page at `/classroom/[code]`
- **Experiment Module** — A/B testing backend (`ExperimentService`, `ExperimentController`) with admin management page and public experiment page
- **AI Narration (TTS)** — `AzureTtsService` and `EdgeTtsService` for generating audio narration from visualization content. `NarrationPlayer` component with playback controls
- **Spam Checker** — Heuristic + AI-based spam detection for comments (`spam-checker.ts`)
- **E2E Tests** — Playwright test suites for admin pages, classroom, visualization create, and visualization detail

### Enhancements — Visualizations
- **AI Tutor Sidebar** — `AITutorSidebar` component with contextual Q&A, `TutorChatBubble` for message display, and `useAITutor` hook
- **Article Mode** — `ArticleLayout`, `ArticleSection`, `QuizPanel`, `ReadingProgress`, and `TableOfContents` components for structured learning
- **Difficulty Switcher** — `DifficultySwitcher` component for beginner/intermediate/advanced variants
- **Experiment Switcher** — `ExperimentSwitcher` for A/B variant selection on visualizations
- **Narration Player** — `NarrationPlayer` with synchronized audio playback
- **Perspective Cards** — `PerspectiveCard` for multiple-viewpoint explanations
- **Version Diff** — `VersionDiff` component for comparing visualization versions side-by-side
- **Content Tabs** — `VizContentTabs`, `VizMetadataSection`, `VizSocialTabs`, `VizStickyHeader`, `VizMobileBottomBar` for improved mobile/desktop UX
- **Server-driven Sync** — `VizRendererCard` with `usePostMessageBridge` for teacher-to-student parameter sync

### Enhancements — General
- **Post Display** — New `PostHero` and `PostSidebar` components for improved article layout
- **Comment Likes** — `CommentLikeButton` component
- **UI Components** — New `checkbox` component (Radix UI). Extended `badge`, `button`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `popover`, `progress`, `select`, `sheet`, `skeleton`, `switch`, `tabs`, `textarea`, `tooltip`
- **Markdown Rendering** — `markdown.tsx` utility for rich content display
- **Embed Support** — Embeddable visualization page at `/embed/[id]`
- **SEO** — Added `robots.txt` and `sitemap.xml`
- **Admin** — New experiments management page, improved all admin pages with consistent styling

### Infrastructure
- **Prisma Migration** — `narration_audio_url` field for narration scripts
- **Environment** — Added `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL` config variables
- **Tailwind Config** — Extended with new animation and layout utilities
- **Dependencies** — Updated backend and frontend package locks

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
