# Build context must be the repo root (pnpm workspace), e.g.:
#   docker build -f apps/api/Dockerfile .
# In Coolify: set "Docker Build Context" to the repo root and
# "Dockerfile Location" to apps/api/Dockerfile.

FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /repo

# Manifests first so `pnpm install` is cached across rebuilds that only
# touch source files.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/web-3d/package.json apps/web-3d/package.json
COPY packages/a2ui-spec/package.json packages/a2ui-spec/package.json

RUN pnpm install --frozen-lockfile

COPY packages/a2ui-spec packages/a2ui-spec
COPY apps/api apps/api

RUN pnpm --filter @gloomy/a2ui-spec build
RUN pnpm --filter @gloomy/api build

ENV NODE_ENV=production
WORKDIR /repo/apps/api

EXPOSE 4000
CMD ["node", "dist/index.js"]
