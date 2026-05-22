# Changelog

## 2026-05-22 — NestJS v11 Upgrade

### Breaking Changes
- **NestJS v11** — Upgraded from `@nestjs/core` v10.3.0 → v11.1.23 with Express v5 platform, updated CLI/schematics/testing to v11.x
- **TypeScript** — Upgraded from v5.3.3 → v5.7.3
- **reflect-metadata** — Upgraded from v0.1.14 → v0.2.2

### Dependencies
- **Updated**: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/websockets`, `@nestjs/platform-socket.io` → 11.1.23
- **Updated**: `@nestjs/swagger` → 11.4.4, `@nestjs/jwt` → 11.0.2, `@nestjs/passport` → 11.0.5
- **Updated**: `@nestjs/cli` → 11.0.21, `@nestjs/schematics` → 11.1.0, `@nestjs/testing` → 11.1.23
- **Updated**: `typescript` → 5.7.3, `reflect-metadata` → 0.2.2, `rxjs` → 7.8.2

### Fixes
- **Test DI resolution** — Fixed test mocks for stricter NestJS v11 dependency injection (added missing `NotificationsGateway`, `AzureTtsService`, `EdgeTtsService` mocks, updated controller test expectations)

### Verification
- All 248 tests pass across 31 suites, build succeeds with no errors
=======
## 2026-05-22 — Homepage & Experiments UI Redesign

### Features
- **Immersive Homepage** — Cinematic hero section with CSS particle field, orbiting rings, cursor-aware glow, and magnetic button effects. Topic zones with branded gradient backgrounds (AI/Web3/Blockchain), accent corner glows, and animated heading underlines. About section with stats counters and glass-card skill chips. Scroll progress bar and back-to-top button
- **Lab-Themed Experiments Page** — Floating geometric shapes, glow dot particles, and concept filter pills (All/Mathematics/Physics/Biology). Enhanced `PerspectiveCard` with top gradient stripe, icon header, and inset perspective panels with hover-reveal arrows. Experiment detail page with pill-style perspective switcher and ambient glow viz container
- **3D Card Tilt** — `PostCard` now features perspective transform on mouse move with dynamic shadow lift, smooth transition easing

### Enhancements
- **i18n Wording Completion** — Replaced all hardcoded English text in homepage and experiments pages with proper i18n keys. Added 13 new translation keys across all 4 locales (en/zh-CN/zh-TW/ja): `common.loadMore`, `common.view`, `common.clearFilter`, `home.aboutQuote`, `home.scrollDown`, `home.sectionAiLabel/Desc`, `home.sectionWeb3Label/Desc`, `home.sectionBlockchainLabel/Desc`, `viz.biology`, `viz.experiment.morePerspectives`
- **Section Spacing** — Increased vertical padding across all homepage and experiments sections for better visual breathing room (mobile: 64-80px, desktop: 96-112px). Added spacing containers around `BannerCarousel` instances
- **Visualization Components** — Enhanced `VizContentTabs`, `VizMetadataSection`, `VizSocialTabs`, `VizStickyHeader`, `VizMobileBottomBar`, `VizRendererCard`, `VisualizationComments`, `RelatedVisualizations`, `NarrationPlayer` with improved layout and styling
- **Admin Pages** — Refined `ai-usage`, `banners`, `logs`, `posts/edit`, `posts/new`, `settings` admin pages
- **UI Components** — Updated `tabs` component, `RichEditor`, and `AITools` with enhanced styling

### Effects & Animation
- **CSS Keyframes** — Added 7 new animations: `particle-float`, `particle-float-slow`, `orbit-rotate`, `stripe-shift`, `lab-float-1/2/3`
- **Utility Classes** — Added 20+ new CSS utility classes for particle fields, orbit rings, cursor glow, magnetic buttons, topic backgrounds, filter pills, perspective stripes/rows, lab shapes, stat counters, and pill switchers
- **animejs** — Scroll-triggered stagger animations via `IntersectionObserver` + `SectionReveal` component

## 2026-05-22 — Plate.js AI Editor & Multi-Provider AI Support

### Breaking Changes
- **Plate.js Editor** — Replaced wangeditor with Plate.js rich-text editor (192 component files). Maintains same `{ value, onChange, placeholder }` interface
- **AI Multi-Provider** — Added `/api/ai/command` and `/api/ai/copilot` endpoints supporting OpenAI (via Gateway), DeepSeek, and Grok. Provider routing by model prefix (`deepseek/*`, `grok/*`, `openai/*`)

### Dependencies
- **Added**: `@ai-sdk/gateway`, `@ai-sdk/openai-compatible`, `@platejs/ai`, `@platejs/dnd`, `@platejs/markdown`, `@platejs/suggestion`, `@platejs/selection`, `@platejs/table`, `@platejs/media`, `@platejs/list`, `@platejs/link`, `@platejs/emoji`, `@platejs/indent`, `@platejs/docx`, `@platejs/callout`, `@platejs/code-block`, `@platejs/alignment`, `@platejs/font`, `platejs`, `react-dnd`, `react-dnd-html5-backend`, `showdown`, `@faker-js/faker`, `lodash`, `dedent`, `@types/lodash`, `@types/showdown`
- **Removed**: `@wangeditor-next/editor`, `@wangeditor-next/editor-for-react`

### Features
- **RichEditor** — One-way data sync with `serializeMd` + `showdown` for HTML serialization, avoiding React context issues during static rendering. `BlogEditorKit` for lightweight editing without DnD/collaboration overhead
- **AI Provider Routing** — `getModel()` in `src/lib/ai-providers.ts` auto-routes to DeepSeek when no `AI_GATEWAY_API_KEY` configured. Built-in support for API key config via env vars
- **TooltipProvider** — Added to root layout (required by Plate.js components)

## 2026-05-21 — shadcn/ui & Tailwind CSS v4 Upgrade

### Breaking Changes
- **Tailwind CSS v4** — Upgraded from Tailwind CSS 3.4 → 4.3. Removed `tailwind.config.ts`, migrated all theme configuration to CSS-based `@theme` directives in `globals.css`. PostCSS plugin changed from `tailwindcss` → `@tailwindcss/postcss`
- **shadcn/ui Latest** — Upgraded from `shadcn` v4.7.0 (old CLI) to latest `shadcn@latest`. Replaced 13 individual `@radix-ui/*` packages with unified `radix-ui` v1.4.3
- **CSS Variables Theming** — shadcn components now use CSS custom properties (`--primary`, `--background`, `--foreground`, etc.) for theming instead of direct Tailwind class colors

### Dependencies
- **Added**: `radix-ui` (unified), `@tailwindcss/postcss`, `tw-animate-css`
- **Removed**: `shadcn` (old CLI), `autoprefixer` (built into Tailwind v4), 13 individual `@radix-ui/*` packages
- **Updated**: `tailwindcss` 3.4 → 4.3, `lucide-react` 1.14 → 1.16

### Component Updates
- **22 UI components** updated to latest shadcn patterns: `data-slot` attributes, `Slot.Root` from unified `radix-ui`, CSS variable-based color classes, new size/variant conventions
- All custom theme colors, fonts, spacing, shadows, and animations preserved in CSS `@theme` configuration

## 2026-05-21 — Next.js 16 Upgrade & i18n Migration

### Breaking Changes
- **Next.js 16 + React 19** — Upgraded from Next.js 14.2 → 16.2 and React 18 → 19.2
- **i18n: i18next → next-intl** — Migrated translation library from `i18next`/`react-i18next` to `next-intl` (Next.js official recommendation). 77 component files updated
- **URL Structure** — All routes now include locale prefix: `/{locale}/...` (e.g., `/en/posts/hello`, `/zh-CN/posts/hello`). Middleware (`proxy.ts`) handles locale detection and redirect
- **Translation Files** — Moved from `public/locales/{lang}/translation.json` → `messages/{lang}.json`, restructured flat dotted keys to nested objects, migrated `{{var}}` → `{var}` (ICU format)
- **next.config** — Migrated from `next.config.js` (CJS) to `next.config.ts` (TypeScript)

### Directory Structure
- **`[locale]` Segment** — All page routes moved from `src/app/` → `src/app/[locale]/` to follow Next.js i18n routing convention
- **New files**: `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/i18n/navigation.ts`, `src/proxy.ts`
- **Removed**: `src/lib/i18n/` (replaced by `src/i18n/`), `public/locales/`, `next.config.js`

### Infrastructure
- **TypeScript 6.0** — Upgraded from TypeScript 5.3 → 6.0
- **Turbopack** — Now the default bundler in Next.js 16
- **middleware → proxy** — Renamed to `proxy.ts` per Next.js 16 convention

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
