# Changelog

Toutes les évolutions notables du projet sont listées ici.
Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), versions en [SemVer](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté

- Flux à trois branches protégées : `dev` (intégration), `main` (staging, tags de sprint), `prod` (production).
- Workflows CI, CodeQL, déploiement (staging et production) et APK Android sur les trois branches.
- Fichiers de configuration : `.env.example`, `.nvmrc`, `.npmrc`, `.dockerignore`, Prettier, hooks Husky.
- `CODEOWNERS`, Dependabot (vers `dev`), templates d'issue et de pull request.
- `AGENTS.md` : contexte du projet pour les assistants de code.
- Backlog réparti par personne (`owners`) et par pôle (backend, web, mobile, transverse).
- Hébergement Render (API, web) + Neon (PostgreSQL), staging et production (ADR 0004 accepté) ; URLs visibles dans la section Deployments de GitHub.

### Modifié

- PostgreSQL 18 en local, aligné sur Neon. **Action requise** si une base locale existe déjà : `docker compose down` puis `./scripts/setup.sh` (nouveau volume `pg18-data`, l'ancien `db-data` peut être supprimé avec `docker volume rm lislestart_db-data`).
- Image de l'API : Prisma lancé sans pnpm au démarrage (réveil plus rapide sur Render) ; `ENV CI=true` dans les Dockerfiles.

### Corrigé

- Permissions Gitleaks et CodeQL en CI (#6), vulnérabilités hautes des dépendances (#7), déploiement exécuté sur la branche poussée (#11).

## [0.1.0] - Sprint 0

### Ajouté

- Monorepo pnpm + Turborepo : `apps/api`, `apps/web`, `apps/mobile`, `apps/simulator`, `packages/engine`, `packages/shared`.
- Installation en une commande (`scripts/setup.sh`) avec Docker Compose (PostgreSQL, Redis, API, web).
- CI GitHub Actions : lint, typecheck, tests, scan de secrets (Gitleaks), analyse CodeQL.
- Templates d'issue et de pull request, conventions de contribution, code de conduite.
- Documentation de départ : architecture, premiers ADR, modèle de données, guide de prise en main.
- Moteur : génération d'un arbre à élimination simple avec exempts, testée.
