# syntax=docker/dockerfile:1
# Production image for apps/api (NestJS) — deploy to Railway or AWS ECS

FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/
RUN pnpm install --frozen-lockfile --filter @genie/api...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api ./apps/api
COPY packages/types ./packages/types
COPY packages/config ./packages/config
RUN pnpm --filter @genie/api exec prisma generate
RUN pnpm --filter @genie/api build

FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/genie"
RUN pnpm install --frozen-lockfile --prod --filter @genie/api... --ignore-scripts
RUN cd apps/api && npx --yes prisma@6.19.3 generate

FROM node:22-alpine AS runner
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
WORKDIR /app
ARG GIT_COMMIT_SHA=unknown
ARG RAILWAY_GIT_COMMIT_SHA=unknown
ARG APP_VERSION=0.2.1
ENV GIT_COMMIT_SHA=${RAILWAY_GIT_COMMIT_SHA:-$GIT_COMMIT_SHA}
ENV RAILWAY_GIT_COMMIT_SHA=$RAILWAY_GIT_COMMIT_SHA
ENV APP_VERSION=$APP_VERSION
ENV NODE_ENV=production

COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=prod-deps --chown=nestjs:nodejs /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=nestjs:nodejs /app/apps/api/package.json ./apps/api/package.json
COPY --from=build --chown=nestjs:nodejs /app/apps/api/prisma ./apps/api/prisma

USER nestjs
WORKDIR /app/apps/api
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-4000}/health" || exit 1

CMD ["node", "dist/main.js"]
