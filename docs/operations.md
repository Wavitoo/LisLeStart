# Exploitation

## Pipeline CI/CD

| Workflow     | Déclencheur                              | Étapes                                                         |
| ------------ | ---------------------------------------- | -------------------------------------------------------------- |
| `ci.yml`     | Chaque PR et push sur `main`             | Gitleaks, lint, typecheck, tests, build, audit des dépendances |
| `codeql.yml` | Chaque PR, push sur `main`, chaque lundi | Analyse SAST                                                   |
| `deploy.yml` | CI réussie sur `main`                    | Déploiement de l'API et du web                                 |
| `mobile.yml` | Push sur `main` touchant le mobile       | APK Android en artefact                                        |

## Protection de `main` (à régler dans Settings › Branches)

- Pull request obligatoire, 1 approbation minimum.
- Checks requis : « Scan de secrets », « Lint, types, tests, build », « Analyse SAST ».
- Pas de push direct, pas de force push.

## Secrets GitHub à créer

| Secret                   | Usage                                    |
| ------------------------ | ---------------------------------------- |
| `RENDER_DEPLOY_HOOK_API` | Déploiement de l'API                     |
| `RENDER_DEPLOY_HOOK_WEB` | Déploiement du web                       |
| `STARTGG_API_TOKEN`      | Synchronisation start.gg en ligne        |
| `EXPO_TOKEN`             | Optionnel : build iOS simulateur via EAS |

## Tests de charge (sprint 5)

À documenter : nombre de spectateurs simulés pendant un même match, délai de mise à jour des classements, limites observées.
