# Changelog

Toutes les évolutions notables du projet sont listées ici.
Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), versions en [SemVer](https://semver.org/lang/fr/).

## [Non publié]

## [0.1.0] - Sprint 0

### Ajouté

- Monorepo pnpm + Turborepo : `apps/api`, `apps/web`, `apps/mobile`, `apps/simulator`, `packages/engine`, `packages/shared`.
- Installation en une commande (`scripts/setup.sh`) avec Docker Compose (PostgreSQL, Redis, API, web).
- CI GitHub Actions : lint, typecheck, tests, scan de secrets (Gitleaks), analyse CodeQL.
- Templates d'issue et de pull request, conventions de contribution, code de conduite.
- Documentation de départ : architecture, premiers ADR, modèle de données, guide de prise en main.
- Moteur : génération d'un arbre à élimination simple avec exempts, testée.
