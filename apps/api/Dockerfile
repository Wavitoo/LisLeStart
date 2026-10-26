FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile \
 && pnpm --filter @lislestart/api... build \
 && pnpm --filter @lislestart/api db:generate

FROM base AS run
ENV NODE_ENV=production
COPY --from=build /repo /repo
WORKDIR /repo/apps/api
USER node
EXPOSE 4000
CMD ["sh", "-c", "pnpm db:deploy && node dist/main.js"]
