FROM node:24-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/api-gateway/package.json services/api-gateway/package.json
RUN pnpm install --filter api-gateway --prod=false --frozen-lockfile

FROM deps AS build
COPY services/api-gateway services/api-gateway
RUN pnpm --filter api-gateway build
RUN pnpm deploy --filter api-gateway --prod --legacy /prod/api-gateway

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /prod/api-gateway ./

EXPOSE 5080
CMD ["node", "dist/server.js"]