# Build context must be the repo root (pnpm workspace), e.g.:
#   docker build -f apps/web-3d/Dockerfile .
# In Coolify: set "Docker Build Context" to the repo root and
# "Dockerfile Location" to apps/web-3d/Dockerfile.

FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /repo

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/web-3d/package.json apps/web-3d/package.json
COPY packages/a2ui-spec/package.json packages/a2ui-spec/package.json

RUN pnpm install --frozen-lockfile

COPY apps/web-3d apps/web-3d

RUN pnpm --filter @gloomy/web-3d build

ENV NODE_ENV=production
WORKDIR /repo/apps/web-3d

EXPOSE 3002
CMD ["pnpm", "start"]
