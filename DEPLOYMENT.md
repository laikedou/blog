# Deployment Guide

## Prerequisites

- Docker & Docker Compose installed
- Node.js 20+ (for local development)
- A DeepSeek API key (optional, for AI features)

## Quick Start with Docker

```bash
# Clone and enter project
git clone <repo> && cd blog

# Set environment variables
cp .env.example .env
# Edit .env with your secrets (especially JWT_SECRET and DEEPSEEK_API_KEY)

# Start all services
docker compose up -d --build

# Seed the database (first time only)
docker compose exec backend npx ts-node prisma/seed.ts

# Access:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:4000
# - Swagger Docs: http://localhost:4000/api/docs
```

## Manual Setup (Development)

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Running Tests

### Backend Tests

```bash
cd backend
npm test           # Run all tests
npm test:watch     # Watch mode
npm test:coverage  # With coverage report
```

### Frontend Tests

```bash
cd frontend
npm test           # Run all tests
npm test:watch     # Watch mode
npm test:coverage  # With coverage report
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend port | `4000` |
| `NODE_ENV` | Environment | `development` |
| `JWT_SECRET` | JWT signing secret | (change in production!) |
| `DEEPSEEK_API_KEY` | DeepSeek API key | (optional) |
| `DEEPSEEK_BASE_URL` | DeepSeek API base URL | `https://api.deepseek.com/v1` |
| `DEEPSEEK_MODEL` | DeepSeek model | `deepseek-chat` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

## Security Checklist

- [ ] Change `JWT_SECRET` to a long random string
- [ ] Set `NODE_ENV=production`
- [ ] Configure `FRONTEND_URL` for CORS
- [ ] Enable HTTPS with a reverse proxy (Nginx/Caddy)
- [ ] Set up database backups (SQLite file)
- [ ] Restrict `/uploads` directory permissions
- [ ] Add WAF (Cloudflare, ModSecurity) for production
- [ ] Regular npm audit and dependency updates

## Production Deployment

For production, consider:

1. Using a managed database (PostgreSQL) instead of SQLite
2. Setting up a CDN for uploaded media
3. Using PM2 or Kubernetes for process management
4. Implementing proper logging (ELK stack, DataDog)
5. Setting up monitoring and alerting

### Docker Production Deploy

```bash
# Build with production settings
JWT_SECRET=<strong-secret> DEEPSEEK_API_KEY=<key> docker compose up -d --build

# Or create a .env file and use:
docker compose --env-file .env up -d --build
```

### Backup Strategy

```bash
# Backup SQLite database
docker cp blog-backend:/app/prisma/dev.db ./backups/dev-$(date +%Y%m%d).db

# Backup uploads
docker cp blog-backend:/app/uploads ./backups/uploads-$(date +%Y%m%d)
```
