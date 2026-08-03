FROM node:24-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/core/package.json services/core/package.json
RUN pnpm install --filter core --prod=false --frozen-lockfile

FROM deps AS build
COPY services/core services/core
RUN pnpm --filter core build
RUN pnpm deploy --filter core --prod --legacy /prod/core

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /prod/core ./

EXPOSE 5050
CMD ["node", "dist/server.js"]