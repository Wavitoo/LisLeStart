# Contribuer à LisLeStart

Merci de contribuer ! Ce guide décrit le déroulé d'une contribution, de l'issue au merge.

## Le cycle d'une contribution

1. **Une issue d'abord.** Toute tâche est une issue avec un responsable, des labels, une milestone (le sprint) et un statut dans GitHub Projects.
2. **Une branche par issue**, créée depuis `main` :

   | Type           | Nom de branche                     |
   | -------------- | ---------------------------------- |
   | Fonctionnalité | `feat/<n°issue>-court-descriptif`  |
   | Correction     | `fix/<n°issue>-court-descriptif`   |
   | Docs           | `docs/<n°issue>-court-descriptif`  |
   | Outillage, CI  | `chore/<n°issue>-court-descriptif` |

3. **Des commits conventionnels** ([Conventional Commits](https://www.conventionalcommits.org/fr/)), vérifiés automatiquement par commitlint :

   ```text
   feat(engine): génère un arbre à élimination simple avec exempts
   fix(api): refuse un pronostic après le début du match
   docs(connectors): ajoute le tutoriel du connecteur minimal
   ```

   Types acceptés : `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `chore`, `ci`, `build`, `style`, `revert`.
   Portées usuelles : `engine`, `api`, `web`, `mobile`, `simulator`, `shared`, `docs`, `ci`, `infra`.

4. **Une pull request** liée à son issue (`Closes #12`), avec le template rempli.
5. **Une relecture obligatoire** par un autre membre, et la CI verte. La branche `main` est protégée : personne ne pousse directement dessus.
6. **Merge en squash** : le titre de la PR devient le commit sur `main`, au format conventionnel.

## Définition de « terminé »

Une issue n'est fermée que si :

- [ ] le code est testé (tests unitaires ou fonctionnels selon la partie) ;
- [ ] la CI est verte (lint, typecheck, tests, scan de secrets, build) ;
- [ ] l'interface est utilisable au clavier et au lecteur d'écran (pour le front et le mobile) ;
- [ ] la documentation concernée est à jour (`/docs`, OpenAPI, README) ;
- [ ] un autre membre a relu et approuvé la PR.

## Mise en place locale

```bash
./scripts/setup.sh   # installation complète
pnpm dev             # lance les apps en mode développement
```

Les hooks Git (Husky) s'installent avec `pnpm install` :

- `pre-commit` : ESLint et Prettier sur les fichiers modifiés (lint-staged), puis Gitleaks si installé ;
- `commit-msg` : vérification du message par commitlint.

## Secrets

- Aucun secret dans le code ni dans l'historique, jeton start.gg compris.
- En local : `.env` (ignoré par Git), à partir de `.env.example`.
- En CI : secrets GitHub du dépôt uniquement.
- Un secret poussé par erreur : prévenir le groupe, révoquer le secret immédiatement, puis nettoyer l'historique.

## Versions

Un tag SemVer (`v0.1.0`, `v0.2.0`…) est posé à la fin de chaque sprint, et le [CHANGELOG](CHANGELOG.md) est mis à jour.

## Usage de l'IA

Si tu utilises un outil d'IA pour du code, des tests, de la doc ou des visuels, ajoute-le dans la section « Usage de l'IA » du README. Tu restes responsable de ce que tu livres et tu dois pouvoir l'expliquer.
