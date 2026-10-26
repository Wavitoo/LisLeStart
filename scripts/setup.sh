#!/usr/bin/env bash
# Installation complète de LisLeStart en une commande.
set -euo pipefail
cd "$(dirname "$0")/.."

step() { printf "\n\033[1;32m==> %s\033[0m\n" "$1"; }
fail() { printf "\n\033[1;31mErreur : %s\033[0m\n" "$1"; exit 1; }

command -v node >/dev/null || fail "Node.js 22 est requis (https://nodejs.org)."
command -v docker >/dev/null || fail "Docker est requis (https://docs.docker.com/get-docker/)."
node_major=$(node -p 'process.versions.node.split(".")[0]')
[ "$node_major" -ge 22 ] || fail "Node.js 22 ou plus est requis (version actuelle : $(node -v))."

step "Fichier d'environnement"
if [ ! -f .env ]; then
  cp .env.example .env
  secret=$(node -e 'console.log(require("crypto").randomBytes(48).toString("base64"))')
  sed -i.bak "s|^SESSION_SECRET=.*|SESSION_SECRET=${secret}|" .env && rm -f .env.bak
  echo ".env créé à partir de .env.example (SESSION_SECRET généré)."
else
  echo ".env existe déjà : conservé."
fi

step "Dépendances"
corepack enable >/dev/null 2>&1 || true
pnpm install --frozen-lockfile 2>/dev/null || pnpm install

step "Base de données et Redis"
docker compose up -d db redis

step "Migrations et données de démonstration"
pnpm --filter @lislestart/api db:migrate --name init
pnpm --filter @lislestart/api db:seed

step "API et web"
docker compose up -d --build api web

cat <<MSG

LisLeStart est prêt :
  Web     http://localhost:3000
  API     http://localhost:4000
  Docs    http://localhost:4000/docs

Tests : pnpm test   ·   Arrêt : docker compose down
MSG
