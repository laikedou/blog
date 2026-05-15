# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY tsconfig.json next.config.js postcss.config.js ./
COPY src/ ./src/
COPY public/ ./public/

# Build
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache tini

ENV NODE_ENV=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY package.json next.config.js ./

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["npm", "start"]
