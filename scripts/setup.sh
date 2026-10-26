#!/usr/bin/env bash
# Installation complète de LisLeStart en une commande.
set -euo pipefail
cd "$(dirname "$0")/.."

step() { printf "\n\033[1;32m==> %s\033[0m\n" "$1"; }
fail() { printf "\n\033[1;31mErreur : %s\033[0m\n" "$1"; exit 1; }

# Sans cette variable, corepack demande une confirmation avant de télécharger pnpm et le script
# attend une réponse indéfiniment au premier lancement.
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

command -v node >/dev/null || fail "Node.js 22 est requis (https://nodejs.org, ou nvm sous WSL)."
command -v docker >/dev/null || fail "Docker est requis (https://docs.docker.com/get-docker/)."
node_major=$(node -p 'process.versions.node.split(".")[0]')
[ "$node_major" -ge 22 ] || fail "Node.js 22 ou plus est requis (version actuelle : $(node -v))."
docker info >/dev/null 2>&1 \
  || fail "Docker ne répond pas. Lance Docker Desktop (sous WSL : Settings › Resources › WSL integration)."

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
if ! command -v pnpm >/dev/null; then
  corepack enable \
    || fail "corepack enable a échoué. Si Node vient d'apt, installe-le avec nvm (voir README)."
fi
echo "pnpm $(pnpm -v)"
pnpm install --frozen-lockfile \
  || fail "pnpm install a échoué. Si le lockfile est en cause, ne le modifie pas : préviens l'équipe."

step "Base de données et Redis"
docker compose up -d --wait db redis

step "Schéma et données de démonstration"
if compgen -G "apps/api/prisma/migrations/*/migration.sql" >/dev/null; then
  pnpm --filter @lislestart/api exec dotenv -e ../../.env -- prisma migrate deploy
else
  # Aucune migration commitée pour l'instant : synchronise le schéma sans créer de fichier,
  # pour ne pas générer chez chacun une migration différente.
  echo "Aucune migration commitée : schéma appliqué avec « prisma db push »."
  pnpm --filter @lislestart/api exec dotenv -e ../../.env -- prisma db push --skip-generate
fi
pnpm --filter @lislestart/api db:generate
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
