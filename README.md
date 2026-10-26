# LisLeStart

[![CI](https://github.com/OWNER/lislestart/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/lislestart/actions/workflows/ci.yml)

> Organise tes tournois, importe ceux de la communauté et fais vibrer le public avec des pronostics en direct.

LisLeStart est une plateforme de tournois (élimination simple et double, poules, ronde suisse, FFA) avec des pronostics et des Pick'em pour le public. Tout se joue en points, en badges et en titres, sans aucun argent. Projet PGE5 Epitech 2026-2027, réalisé en groupe de 3.

| Lien                      |                                                                 |
| ------------------------- | --------------------------------------------------------------- |
| Démo en ligne             | `https://A-RENSEIGNER` (déployée automatiquement depuis `main`) |
| Documentation             | [`/docs`](docs/README.md)                                       |
| Tableau de bord du projet | GitHub Projects « LisLeStart »                                  |
| Maquette                  | Figma « LisLeStart » (lien à ajouter)                           |

<!-- Captures d'écran : à ajouter dans docs/assets/ au sprint 2 -->

## Sommaire

1. [Prérequis](#prérequis)
2. [Installation en une commande](#installation-en-une-commande)
3. [Lancer les tests](#lancer-les-tests)
4. [Structure du dépôt](#structure-du-dépôt)
5. [Application mobile](#application-mobile)
6. [Contribuer](#contribuer)
7. [Usage de l'IA](#usage-de-lia)
8. [Équipe](#équipe)

## Prérequis

| Outil                   | Version                                    |
| ----------------------- | ------------------------------------------ |
| Node.js                 | 22 LTS (voir `.nvmrc`)                     |
| pnpm                    | 10 (`corepack enable` suffit)              |
| Docker + Docker Compose | Docker Desktop récent ou Docker Engine 24+ |
| Git                     | 2.40+                                      |

Pour le mobile seulement : Android Studio (émulateur) ou l'application Expo Go sur un téléphone Android.

## Installation en une commande

```bash
git clone https://github.com/OWNER/lislestart.git && cd lislestart
./scripts/setup.sh
```

Le script :

1. copie `.env.example` vers `.env` s'il n'existe pas ;
2. installe les dépendances (`pnpm install`) ;
3. démarre PostgreSQL, Redis, l'API et le web avec Docker Compose ;
4. applique les migrations et charge les données de démonstration (tournoi simulé).

Ensuite :

| Service                          | URL                        |
| -------------------------------- | -------------------------- |
| Web                              | http://localhost:3000      |
| API                              | http://localhost:4000      |
| Documentation de l'API (OpenAPI) | http://localhost:4000/docs |

Sans Docker pour les apps (pratique en développement) : `docker compose up -d db redis` puis `pnpm dev`.

## Lancer les tests

```bash
pnpm test        # tous les tests (engine, api, web, mobile) en une commande
pnpm lint        # ESLint + Prettier
pnpm typecheck   # TypeScript sur tout le monorepo
```

Les appels à l'API start.gg sont simulés (mocks) : les tests passent sans connexion.

## Structure du dépôt

```text
apps/
  api/         API NestJS, temps réel Socket.IO, Prisma (PostgreSQL)
  web/         Front Next.js : public, joueur, administration, dashboard
  mobile/      Application React Native (Expo)
  simulator/   Générateur de joueurs, matchs et pronostics (démo et charge)
packages/
  engine/      Moteur de tournoi en TypeScript pur (arbres, suisse, FFA, barèmes, Pick'em)
  shared/      Types et schémas partagés entre web, API et mobile
docs/          Documentation utilisateur, technique, ADR, guide des connecteurs
scripts/       Installation, backlog GitHub
```

Pour aller plus loin, lis le [guide de prise en main](docs/onboarding.md).

## Application mobile

```bash
pnpm --filter @lislestart/mobile start   # puis « a » pour l'émulateur Android
```

Chaque merge sur `main` produit un APK téléchargeable dans les artefacts du workflow « Mobile ».

## Contribuer

Tout passe par une issue, une branche et une pull request relue. Les détails sont dans [CONTRIBUTING.md](CONTRIBUTING.md) et le code de conduite dans [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Usage de l'IA

Conformément à la charte IA du groupe IONIS, voici les outils utilisés et pour quoi faire. Section tenue à jour tout au long du projet.

| Outil              | Usage                                                    | Parties concernées                 |
| ------------------ | -------------------------------------------------------- | ---------------------------------- |
| Claude (Anthropic) | Cadrage du projet, maquette, squelette du dépôt, backlog | `docs/`, configuration, `.github/` |
| _à compléter_      |                                                          |                                    |

Tout code ou contenu généré passe par les mêmes règles que le reste : tests, revue en pull request, sécurité. Chaque membre doit pouvoir l'expliquer en soutenance.

## Équipe

| Membre      | Pôle                   |
| ----------- | ---------------------- |
| Arslan Tetu | Plateforme et sécurité |
| _Membre B_  | Moteur et API          |
| _Membre C_  | Web et mobile          |

## Licence

[MIT](LICENSE). Projet pédagogique, non destiné à être diffusé hors du cadre du projet.
