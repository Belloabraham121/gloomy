# Build context must be the repo root (pnpm workspace), e.g.:
#   docker build -f apps/web/Dockerfile .
# In Coolify: set "Docker Build Context" to the repo root and
# "Dockerfile Location" to apps/web/Dockerfile.
#
# NEXT_PUBLIC_API_URL is baked in at build time (Next.js inlines
# NEXT_PUBLIC_* vars into the client bundle) - set it as a build arg in
# Coolify pointing at the deployed apps/api URL.

FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /repo

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/web-3d/package.json apps/web-3d/package.json
COPY packages/a2ui-spec/package.json packages/a2ui-spec/package.json

RUN pnpm install --frozen-lockfile

COPY packages/a2ui-spec packages/a2ui-spec
COPY apps/web apps/web

RUN pnpm --filter @gloomy/a2ui-spec build

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN pnpm --filter @gloomy/web build

ENV NODE_ENV=production
WORKDIR /repo/apps/web

EXPOSE 3000
CMD ["pnpm", "start"]
