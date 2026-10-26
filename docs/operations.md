# Exploitation

## Branches et environnements

| Branche            | Rôle                                    | Environnement de déploiement |
| ------------------ | --------------------------------------- | ---------------------------- |
| `dev` (par défaut) | Intégration des branches de travail     | Aucun (CI seulement)         |
| `main`             | Version stable, taguée en fin de sprint | `staging`                    |
| `prod`             | Production, démo de soutenance          | `production`                 |

Flux : `feat/*` → PR squash vers `dev` → PR `dev` → `main` (merge commit) → PR `main` → `prod` (merge commit). Détails dans [CONTRIBUTING.md](../CONTRIBUTING.md).

## Pipeline CI/CD

| Workflow            | Déclencheur                                          | Étapes                                                         |
| ------------------- | ---------------------------------------------------- | -------------------------------------------------------------- |
| `ci.yml`            | Chaque PR et push sur `dev`, `main`, `prod`          | Gitleaks, lint, typecheck, tests, build, audit des dépendances |
| `codeql.yml`        | Chaque PR et push sur `dev`, `main`, `prod`, lundi   | Analyse SAST                                                   |
| `ci.yml` › `deploy` | Push sur `main` ou `prod`, après les checks          | Déploiement de l'API et du web (staging ou production)         |
| `mobile.yml`        | Push sur `main` ou `prod` touchant le mobile, manuel | APK Android en artefact (30 jours)                             |

- **Audit des dépendances** : non bloquant (`continue-on-error`). Il signale les vulnérabilités sans empêcher le déploiement ; les corrections passent par Dependabot ou une PR `chore(deps)`.
- **CodeQL** : alertes dans l'onglet Security du dépôt ; rapport SARIF aussi publié en artefact `codeql-sarif` ; le job échoue sur toute alerte de niveau « error ».

## Sécurité du dépôt (public)

Activés dans Settings › Code security : alertes et correctifs de sécurité Dependabot, scan de secrets avec **blocage au push** (un commit contenant un jeton reconnu est refusé), signalement privé de vulnérabilités (onglet Security › Report a vulnerability, voir `SECURITY.md`). Wiki désactivé : la documentation vit dans `/docs`.

## Protection des branches

Appliquée à `dev`, `main` et `prod` (Settings › Branches) :

- Pull request obligatoire, 1 approbation minimum, approbations invalidées par un nouveau commit.
- Checks requis : « Scan de secrets », « Lint, types, tests, build », « Analyse SAST ».
- Branche à jour avant merge, pas de push direct, pas de force push, pas de suppression.
- « Require review from Code Owners » **désactivé** : `CODEOWNERS` sert à demander les relecteurs, pas à bloquer (sinon le seul propriétaire d'une zone ne pourrait jamais faire relire son propre code).

Méthodes de merge autorisées : squash (branches de travail → `dev`) et merge commit (promotions). Rebase désactivé.

## Secrets GitHub à créer

Secrets d'environnement (Settings › Environments), à définir dans `staging` **et** dans `production` avec les valeurs de chaque service Render :

| Secret                   | Usage                |
| ------------------------ | -------------------- |
| `RENDER_DEPLOY_HOOK_API` | Déploiement de l'API |
| `RENDER_DEPLOY_HOOK_WEB` | Déploiement du web   |

Tant qu'ils sont absents, le job `deploy` affiche un avertissement sans échouer.

Secrets du dépôt (Settings › Secrets and variables › Actions) :

| Secret              | Usage                                    |
| ------------------- | ---------------------------------------- |
| `STARTGG_API_TOKEN` | Synchronisation start.gg en ligne        |
| `EXPO_TOKEN`        | Optionnel : build iOS simulateur via EAS |

L'environnement `production` peut exiger une approbation manuelle avant déploiement (Settings › Environments › production › Required reviewers).

## Hébergement (Render + Neon)

Choix justifié dans l'[ADR 0004](adr/0004-hebergement.md). Les URLs sont aussi listées dans la section **Deployments** de la page d'accueil du dépôt GitHub.

| Environnement | Web                                         | API                                         |
| ------------- | ------------------------------------------- | ------------------------------------------- |
| staging       | https://lislestart-web-staging.onrender.com | https://lislestart-api-staging.onrender.com |
| production    | https://lislestart-web.onrender.com         | https://lislestart-api.onrender.com         |

### Créer un service Render

New › Web Service › dépôt `Wavitoo/LisLeStart`, puis :

| Réglage              | API                                         | Web                                         |
| -------------------- | ------------------------------------------- | ------------------------------------------- |
| Name                 | `lislestart-api-staging` / `lislestart-api` | `lislestart-web-staging` / `lislestart-web` |
| Language             | Docker                                      | Docker                                      |
| Branch               | `main` (staging) / `prod` (production)      | idem                                        |
| Region               | Frankfurt (EU Central)                      | Frankfurt (EU Central)                      |
| Dockerfile Path      | `apps/api/Dockerfile`                       | `apps/web/Dockerfile`                       |
| Docker Build Context | `.`                                         | `.`                                         |
| Instance             | Free                                        | Free                                        |
| Health Check Path    | `/health`                                   | `/`                                         |
| Auto-Deploy          | **Off** (seule la CI déploie)               | **Off**                                     |

Variables d'environnement :

| Service | Variable         | Valeur                                                                                     |
| ------- | ---------------- | ------------------------------------------------------------------------------------------ |
| API     | `DATABASE_URL`   | Chaîne Neon de la branche de l'environnement, **sans `-pooler`** et sans `channel_binding` |
| API     | `SESSION_SECRET` | Bouton « Generate » de Render, différent par environnement                                 |
| API     | `API_PORT`       | `10000` (port attendu par Render)                                                          |
| API     | `CORS_ORIGIN`    | URL du web du même environnement, sans `/` final                                           |
| Web     | `HOSTNAME`       | `0.0.0.0` (sinon Next.js n'écoute que sur le nom interne du conteneur)                     |

Enfin : Settings › Deploy Hook du service → secret `RENDER_DEPLOY_HOOK_API` ou `RENDER_DEPLOY_HOOK_WEB` de l'environnement GitHub correspondant.

### Base Neon

- Projet `lislestart`, région AWS Europe Central (Frankfurt), Postgres 18.
- Branches `production` (par défaut) et `staging`, **sans expiration** (Auto-delete désactivé).
- Accès de l'équipe : console Neon › Settings › Collaborators, par e-mail. En production, on lit, on n'écrit jamais à la main : tout changement de schéma passe par une migration Prisma dans une PR.
- En local, chacun utilise le PostgreSQL de Docker Compose, jamais une base Neon.

### Secrets

Ne jamais coller une chaîne de connexion, un hook ou un `SESSION_SECRET` dans un ticket, une PR ou une conversation. En cas de fuite : Neon › Roles › Reset password, Render › Environment › Generate, Render › Settings › Deploy Hook › Regenerate, puis mise à jour du secret GitHub.

## Tests de charge (sprint 5)

À documenter : nombre de spectateurs simulés pendant un même match, délai de mise à jour des classements, limites observées.
