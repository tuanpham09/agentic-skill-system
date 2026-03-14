FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

# ── Install dependencies ──────────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/registry/package.json ./packages/registry/
COPY packages/core/package.json ./packages/core/
RUN pnpm install --frozen-lockfile

# ── Build ─────────────────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/registry/node_modules ./packages/registry/node_modules
COPY . .
RUN pnpm --filter @agentic-skill/registry build

# ── Production image ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Only copy what's needed
COPY --from=builder /app/packages/registry/dist ./dist
COPY --from=builder /app/packages/registry/package.json .
COPY --from=builder /app/node_modules ./node_modules

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 registry
USER registry

# Data directory for SQLite and bundles
VOLUME ["/data"]

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=10s \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/app.js"]
