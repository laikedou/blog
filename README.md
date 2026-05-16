# Blog

A full-featured blog platform built with **NestJS** (backend) and **Next.js** (frontend), featuring AI-powered content generation, data visualizations, and a rich admin dashboard.

## Tech Stack

**Backend**
- [NestJS](https://nestjs.com/) — Node.js framework with modular architecture
- [Prisma](https://prisma.io/) — ORM with SQLite (dev) / PostgreSQL (production)
- [Socket.IO](https://socket.io/) — Real-time chat functionality
- Multiple AI provider SDKs (OpenAI, Anthropic, Google, xAI)

**Frontend**
- [Next.js](https://nextjs.org/) — React framework with App Router
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first styling
- [Radix UI](https://radix-ui.com/) — Accessible headless components
- [wangEditor](https://www.wangeditor.com/) — Rich text editor
- [Recharts](https://recharts.org/) — Data visualization charts
- [Anime.js](https://animejs.com/) — Animations

**DevOps**
- Docker & Docker Compose (Nginx reverse proxy)
- CI-ready with Jest testing

## Project Structure

```
blog/
├── backend/                # NestJS API server (port 4000)
│   ├── prisma/             # Database schema & migrations
│   ├── src/
│   │   ├── ai/             # AI content generation
│   │   ├── ai-usage/       # AI usage tracking & billing
│   │   ├── auth/           # JWT authentication
│   │   ├── banners/        # Banner management
│   │   ├── categories/     # Post categories
│   │   ├── chat/           # Real-time chat (Socket.IO)
│   │   ├── comments/       # Post comments
│   │   ├── crawl/          # Web crawling
│   │   ├── health/         # Health check endpoint
│   │   ├── logs/           # System logs
│   │   ├── media/          # Media/file uploads
│   │   ├── posts/          # Blog posts CRUD
│   │   ├── seo/            # SEO metadata
│   │   ├── site-config/    # Site-wide configuration
│   │   ├── stats/          # Statistics & analytics
│   │   ├── tags/           # Post tags
│   │   ├── users/          # User management
│   │   └── visualization/  # AI-powered data visualizations
│   ├── test/               # E2E tests
│   └── uploads/            # Uploaded media files
├── frontend/               # Next.js frontend (port 3000)
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   │   ├── admin/      # Admin dashboard
│   │   │   ├── posts/      # Public post pages
│   │   │   ├── category/   # Category pages
│   │   │   ├── tag/        # Tag pages
│   │   │   ├── login/      # User login
│   │   │   ├── register/   # User registration
│   │   │   └── visualizations/  # Public visualization gallery
│   │   ├── components/     # Shared UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities & API client
│   │   └── types/          # TypeScript type definitions
│   └── public/             # Static assets
├── docker-compose.yml      # Docker services (backend + frontend + nginx)
├── nginx.conf              # Nginx reverse proxy config
└── setup.sh                # One-click setup script
```

## Quick Start

### Using Docker

```bash
cp .env.example .env
# Edit .env with your secrets (JWT_SECRET, API keys, etc.)
docker compose up -d --build
docker compose exec backend npx ts-node prisma/seed.ts
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Swagger Docs: http://localhost:4000/api/docs

### Manual Development

```bash
# Backend
cd backend
npm install
npx prisma generate && npx prisma db push && npm run prisma:seed
npm run dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed setup and production deployment instructions.

## Features

- **Blog Engine** — Full CRUD for posts, categories, tags, and comments
- **Rich Text Editing** — wangEditor integration with image uploads
- **AI Assistant** — Chatbot and AI-powered content generation (OpenAI, Anthropic, DeepSeek, xAI, Google)
- **Data Visualizations** — AI-generated charts (bar, line, pie, area, scatter, radar, treemap)
- **Admin Dashboard** — Manage posts, media, users, comments, banners, SEO metadata, and site settings
- **Real-time Chat** — Socket.IO-based live chat
- **System Logs** — Action logging and audit trail
- **AI Usage Tracking** — Monitor API consumption across providers
- **SEO** — Configurable meta tags, sitemap generation, Open Graph support
- **Authentication** — JWT-based auth with login/register
- **Responsive Design** — Mobile-friendly with Tailwind CSS
- **Dockerized** — Full stack deployment with Nginx reverse proxy
