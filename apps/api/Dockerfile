# ── Base ────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

# ── Dependencies ────────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm config set ignore-scripts false
RUN npm ci
# ── Build ───────────────────────────────────────────────────────────
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build
RUN ls -la dist && ls -la dist/src

# ── Production ──────────────────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm config set ignore-scripts false
RUN npm ci --omit=dev

# Run as a non-root user for defense-in-depth
RUN addgroup -g 1001 -S nodejs && adduser -S tsa -u 1001
USER tsa

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/v1/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/src/server.js"]
