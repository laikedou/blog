# AI Blog 📝

A full-featured blog platform built with **NestJS** and **Next.js**, featuring AI-powered content generation, interactive data visualizations, and a comprehensive admin dashboard.

<p align="center">
  <img src="./screenshots/home.png" alt="Homepage" width="800" />
</p>

## ✨ Features at a Glance

| | | |
|---|---|---|
| 🤖 **AI-Powered** — Content generation, chatbot, image creation, visualization generation | 📊 **Data Visualizations** — AI-generated interactive charts (bar, line, pie, area, scatter, radar, treemap) | 🌐 **i18n Ready** — Full internationalization with English, Chinese (Simplified/Traditional), and Japanese |
| 🎨 **Rich Editor** — wangEditor integration with image uploads and AI-assisted writing | 🔐 **JWT Auth** — Secure authentication with admin and user roles | 📈 **Analytics** — AI usage tracking, system logs, and visualization stats |
| 🖼️ **Media Library** — Centralized image management with AI generation | 🏷️ **Categories & Tags** — Flexible content organization | 📱 **Responsive** — Mobile-friendly design with Tailwind CSS |

## 🚀 Tech Stack

**Backend** | **Frontend** | **DevOps**
---|---|---
[NestJS](https://nestjs.com/) — Modular Node.js framework | [Next.js](https://nextjs.org/) — React App Router | Docker & Docker Compose
[Prisma](https://prisma.io/) — ORM (SQLite/PostgreSQL) | [Tailwind CSS](https://tailwindcss.com/) — Utility-first styling | Nginx reverse proxy
[Socket.IO](https://socket.io/) — Real-time chat | [Radix UI](https://radix-ui.com/) — Accessible components | CI-ready (Jest)
OpenAI / Anthropic / Google / xAI SDKs | [Recharts](https://recharts.org/) — Charts & analytics | |

## 📸 Screenshots

### 🏠 Public Pages

<table>
  <tr>
    <td width="50%"><strong>Homepage</strong><br><img src="./screenshots/home.png" alt="Homepage" width="100%"/></td>
    <td width="50%"><strong>Visualization Gallery</strong><br><img src="./screenshots/visualizations.png" alt="Visualization Gallery" width="100%"/></td>
  </tr>
  <tr>
    <td width="50%"><strong>Login Page</strong><br><img src="./screenshots/login.png" alt="Login Page" width="100%"/></td>
    <td width="50%"></td>
  </tr>
</table>

### 🔧 Admin Dashboard

<table>
  <tr>
    <td width="50%"><strong>Admin Dashboard</strong><br><img src="./screenshots/admin-dashboard.png" alt="Admin Dashboard" width="100%"/></td>
    <td width="50%"><strong>Posts Management</strong><br><img src="./screenshots/admin-posts.png" alt="Admin Posts" width="100%"/></td>
  </tr>
  <tr>
    <td width="50%"><strong>Visualizations List</strong><br><img src="./screenshots/admin-visualizations.png" alt="Admin Visualizations" width="100%"/></td>
    <td width="50%"><strong>AI Visualization Creator</strong><br><img src="./screenshots/admin-visualizations-create.png" alt="AI Visualization Creator" width="100%"/></td>
  </tr>
  <tr>
    <td width="50%"><strong>Visualization Stats</strong><br><img src="./screenshots/admin-visualizations-stats.png" alt="Visualization Stats" width="100%"/></td>
    <td width="50%"><strong>AI Usage Analytics</strong><br><img src="./screenshots/admin-ai-usage.png" alt="AI Usage" width="100%"/></td>
  </tr>
  <tr>
    <td width="50%"><strong>System Logs</strong><br><img src="./screenshots/admin-logs.png" alt="System Logs" width="100%"/></td>
    <td width="50%"><strong>Site Settings</strong><br><img src="./screenshots/admin-settings.png" alt="Site Settings" width="100%"/></td>
  </tr>
  <tr>
    <td width="50%"><strong>Media Library</strong><br><img src="./screenshots/admin-media.png" alt="Media Library" width="100%"/></td>
    <td width="50%"><strong>Chat Analytics</strong><br><img src="./screenshots/admin-chat-analytics.png" alt="Chat Analytics" width="100%"/></td>
  </tr>
  <tr>
    <td width="50%"><strong>Categories</strong><br><img src="./screenshots/admin-categories.png" alt="Categories" width="100%"/></td>
    <td width="50%"><strong>Tags</strong><br><img src="./screenshots/admin-tags.png" alt="Tags" width="100%"/></td>
  </tr>
  <tr>
    <td width="50%"><strong>Comments</strong><br><img src="./screenshots/admin-comments.png" alt="Comments" width="100%"/></td>
    <td width="50%"><strong>Banners</strong><br><img src="./screenshots/admin-banners.png" alt="Banners" width="100%"/></td>
  </tr>
  <tr>
    <td width="50%"><strong>SEO Settings</strong><br><img src="./screenshots/admin-seo.png" alt="SEO" width="100%"/></td>
    <td width="50%"><strong>Web Crawler</strong><br><img src="./screenshots/admin-crawl.png" alt="Web Crawler" width="100%"/></td>
  </tr>
</table>

## 📁 Project Structure

```
blog/
├── backend/                    # NestJS API server (port 4000)
│   ├── prisma/                 # Database schema & migrations
│   ├── src/
│   │   ├── ai/                 # AI content generation
│   │   ├── ai-usage/           # AI usage tracking & billing
│   │   ├── auth/               # JWT authentication
│   │   ├── banners/            # Banner management
│   │   ├── categories/         # Post categories
│   │   ├── chat/               # Real-time chat (Socket.IO)
│   │   ├── comments/           # Post comments
│   │   ├── crawl/              # Web crawling
│   │   ├── health/             # Health check endpoint
│   │   ├── logs/               # System logs
│   │   ├── media/              # Media/file uploads
│   │   ├── posts/              # Blog posts CRUD
│   │   ├── seo/                # SEO metadata
│   │   ├── site-config/        # Site-wide configuration
│   │   ├── stats/              # Statistics & analytics
│   │   ├── tags/               # Post tags
│   │   ├── users/              # User management
│   │   └── visualization/      # AI-powered data visualizations
│   ├── test/                   # E2E tests
│   └── uploads/                # Uploaded media files
├── frontend/                   # Next.js frontend (port 3000)
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   │   ├── admin/          # Admin dashboard (15+ pages)
│   │   │   ├── posts/          # Public post pages
│   │   │   ├── visualizations/ # Public visualization gallery
│   │   │   └── ...             # Login, register, category, tag, etc.
│   │   ├── components/         # 40+ shared UI components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # API client & utilities
│   │   └── types/              # TypeScript type definitions
│   └── public/                 # Static assets & i18n locales
├── screenshots/                # Feature screenshots
├── docker-compose.yml          # Docker services
├── nginx.conf                  # Nginx reverse proxy config
└── setup.sh                    # One-click setup script
```

## 🚀 Quick Start

### Using Docker

```bash
cp .env.example .env
# Edit .env with your secrets (JWT_SECRET, API keys, etc.)
docker compose up -d --build
docker compose exec backend npx ts-node prisma/seed.ts
```

- **Frontend** → http://localhost:3000
- **Backend API** → http://localhost:4000
- **Swagger Docs** → http://localhost:4000/api/docs

**Demo accounts:**
- Admin: `admin` / `admin123`
- User: `demo` / `user123`

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

## 🔥 Key Features

### 🤖 AI-Powered Content
- **AI Chatbot** — Real-time conversational AI with multiple provider support (OpenAI, Anthropic, DeepSeek, xAI, Google)
- **Content Generation** — Generate, enhance, rewrite, and summarize blog posts with AI
- **Image Generation** — Create and replace images using AI
- **Visualization Generator** — Describe a concept, and AI generates an interactive HTML visualization

### 📊 Interactive Visualizations
- AI-generated charts: bar, line, pie, area, scatter, radar, treemap
- Version history with diff and restore
- Interactive preview with AI refinement
- Public gallery with like, comment, and share

### 🌐 Internationalization (i18n)
- 4 languages: English, Simplified Chinese, Traditional Chinese, Japanese
- Complete coverage across all pages and components
- Easy to extend with additional locales

### 🔧 Admin Dashboard
- **Posts** — Full CRUD with rich text editor and AI writing assistant
- **Visualizations** — Manage, create, and analyze AI-generated visualizations
- **Media Library** — Upload and manage images with AI generation
- **Categories & Tags** — Organize content taxonomy
- **Comments** — Moderate user comments
- **Banners** — Manage homepage banner carousel
- **SEO** — Configure meta tags, Open Graph, and sitemap
- **AI Usage** — Track API consumption across providers
- **System Logs** — Monitor and audit system activity
- **Settings** — Site-wide configuration management

## 📦 i18n Support

| Language | Code | Status |
|----------|------|--------|
| English | `en` | ✅ Complete |
| Simplified Chinese | `zh-CN` | ✅ Complete |
| Traditional Chinese | `zh-TW` | ✅ Complete |
| Japanese | `ja` | ✅ Complete |

## 📄 License

MIT
