FROM node:24-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/partner-adapter/package.json services/partner-adapter/package.json
RUN pnpm install --filter partner-adapter --prod=false --frozen-lockfile

FROM deps AS build
COPY services/partner-adapter services/partner-adapter
RUN pnpm --filter partner-adapter build
RUN pnpm deploy --filter partner-adapter --prod --legacy /prod/partner-adapter

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /prod/partner-adapter ./

EXPOSE 5070
CMD ["node", "dist/server.js"]