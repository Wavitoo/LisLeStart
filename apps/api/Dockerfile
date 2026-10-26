FROM node:22-alpine AS base
ENV CI=true
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
# Prisma appelé directement (sans pnpm) : pas de téléchargement de pnpm par corepack à chaque
# démarrage, ce qui raccourcit le réveil d'une instance gratuite en veille.
CMD ["sh", "-c", "/repo/node_modules/.bin/prisma migrate deploy && node dist/main.js"]
