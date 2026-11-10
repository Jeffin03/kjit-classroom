# syntax=docker/dockerfile:1

# Multi-stage build for the Next.js standalone server.
# Produces a small runtime image (no dev dependencies, no source).

FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
# --ignore-scripts skips install hooks for docs-only dev dependencies
# (phantomjs-prebuilt has no arm64 binary) that the Next build never uses.
RUN npm ci --ignore-scripts

FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# public/ is optional and may be absent from a fresh checkout; Next's standalone
# output does not create it, but the runner stage copies it unconditionally.
RUN mkdir -p public
# Build without secrets: the app reads all configuration at runtime.
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
