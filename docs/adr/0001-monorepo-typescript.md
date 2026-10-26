# 0001 — Monorepo TypeScript

- Statut : accepté
- Date : 2026-10-25

## Contexte

Trois personnes, quatre applications (API, web, mobile, simulateur) et un moteur de règles partagé. Le sujet exige des tests en une commande et une installation en moins de 15 minutes.

## Options envisagées

1. Plusieurs dépôts : isolation forte, mais types dupliqués et synchronisation pénible.
2. Monorepo multi-langages (ex. API en Python) : bon outillage, mais deux écosystèmes à maîtriser pour 3 personnes.
3. Monorepo TypeScript avec pnpm workspaces et Turborepo : un langage, des types partagés, une commande pour tout.

## Décision

Option 3 : monorepo TypeScript, pnpm workspaces, Turborepo.

## Conséquences

- Les types du modèle (`packages/shared`) sont les mêmes partout.
- Le moteur (`packages/engine`) est testable seul, sans base de données.
- Une seule CI, un seul lockfile, `pnpm test` lance tout.
