# Exploitation

## Branches et environnements

| Branche            | Rôle                                    | Environnement de déploiement |
| ------------------ | --------------------------------------- | ---------------------------- |
| `dev` (par défaut) | Intégration des branches de travail     | Aucun (CI seulement)         |
| `main`             | Version stable, taguée en fin de sprint | `staging`                    |
| `prod`             | Production, démo de soutenance          | `production`                 |

Flux : `feat/*` → PR squash vers `dev` → PR `dev` → `main` (merge commit) → PR `main` → `prod` (merge commit). Détails dans [CONTRIBUTING.md](../CONTRIBUTING.md).

## Pipeline CI/CD

| Workflow     | Déclencheur                                          | Étapes                                                         |
| ------------ | ---------------------------------------------------- | -------------------------------------------------------------- |
| `ci.yml`     | Chaque PR et push sur `dev`, `main`, `prod`          | Gitleaks, lint, typecheck, tests, build, audit des dépendances |
| `codeql.yml` | Chaque PR et push sur `dev`, `main`, `prod`, lundi   | Analyse SAST                                                   |
| `deploy.yml` | CI réussie après un push sur `main` ou `prod`        | Déploiement de l'API et du web (staging ou production)         |
| `mobile.yml` | Push sur `main` ou `prod` touchant le mobile, manuel | APK Android en artefact (30 jours)                             |

- **Audit des dépendances** : non bloquant (`continue-on-error`). Il signale les vulnérabilités sans empêcher le déploiement ; les corrections passent par Dependabot ou une PR `chore(deps)`.
- **CodeQL** : le code scanning GitHub n'est pas disponible sur un dépôt privé sans GitHub Code Security. L'analyse tourne quand même, le rapport SARIF est publié en artefact `codeql-sarif` et le job échoue sur toute alerte de niveau « error ». Si le dépôt devient public, repasser `upload: never` à la valeur par défaut pour retrouver les alertes dans l'onglet Security.

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

Tant qu'ils sont absents, `deploy.yml` affiche un avertissement sans échouer.

Secrets du dépôt (Settings › Secrets and variables › Actions) :

| Secret              | Usage                                    |
| ------------------- | ---------------------------------------- |
| `STARTGG_API_TOKEN` | Synchronisation start.gg en ligne        |
| `EXPO_TOKEN`        | Optionnel : build iOS simulateur via EAS |

L'environnement `production` peut exiger une approbation manuelle avant déploiement (Settings › Environments › production › Required reviewers).

## Tests de charge (sprint 5)

À documenter : nombre de spectateurs simulés pendant un même match, délai de mise à jour des classements, limites observées.
