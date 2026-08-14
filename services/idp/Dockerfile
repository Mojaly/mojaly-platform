FROM node:24-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/idp/package.json services/idp/package.json
RUN pnpm install --filter idp --prod=false --frozen-lockfile

FROM deps AS build
COPY services/idp services/idp
RUN pnpm --filter idp build
RUN pnpm deploy --filter idp --prod --legacy /prod/idp

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /prod/idp ./
EXPOSE 5080
CMD ["node", "dist/server.js"]
