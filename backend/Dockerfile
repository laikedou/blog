# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm ci --only=production 2>/dev/null; npm install --save-dev @nestjs/cli @types/node typescript 2>/dev/null || true

# Copy source
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY prisma/ ./prisma/
COPY src/ ./src/

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache tini

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package.json ./

RUN npx prisma generate 2>/dev/null || true

# Create uploads directory
RUN mkdir -p /app/uploads

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

EXPOSE 4000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
