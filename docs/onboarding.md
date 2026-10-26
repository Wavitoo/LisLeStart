# Prise en main

Objectif : un nouveau contributeur lance la plateforme, un tournoi simulé et les tests en moins de 15 minutes.

## 1. Installer (5 min)

Prérequis : Node 22, Docker, Git. **Sous Windows, tout se fait dans WSL (Ubuntu)** :

- Node via nvm : `nvm install 22` (pas le Node d'`apt`, trop ancien et sans droits pour `corepack enable`) ;
- Docker Desktop › Settings › Resources › WSL integration activée pour la distribution ;
- dépôt cloné dans le dossier personnel WSL (`~/lislestart`), **jamais** dans `/mnt/c` ou `/mnt/g` : lent, et les `node_modules` Windows y sont incompatibles avec Linux.

```bash
git clone https://github.com/Wavitoo/LisLeStart.git ~/lislestart && cd ~/lislestart
./scripts/setup.sh
```

Le script applique les migrations commitées (`prisma migrate deploy`). Tant qu'il n'y en a aucune, il synchronise le schéma avec `prisma db push`, sans créer de fichier de migration.

En cas de souci :

| Symptôme                                               | Solution                                                                           |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| « Docker ne répond pas »                               | Lancer Docker Desktop, vérifier l'intégration WSL                                  |
| « corepack enable a échoué »                           | Node installé par `apt` : le remplacer par nvm                                     |
| `P3005` (base non vide) après l'arrivée des migrations | Base locale créée avant elles : `docker compose down -v` puis `./scripts/setup.sh` |
| Ports 3000, 4000 ou 5432 déjà pris                     | Arrêter l'autre service, ou un ancien `docker compose` lancé depuis Windows        |

## 2. Où se trouve quoi

| Je veux…                                                     | Je vais dans…                                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Changer une règle de tournoi (arbre, suisse, FFA, départage) | `packages/engine/src/`                                                          |
| Ajouter un endpoint                                          | `apps/api/src/<module>/`                                                        |
| Modifier le schéma de la base                                | `apps/api/prisma/schema.prisma` puis `pnpm --filter @lislestart/api db:migrate` |
| Modifier une page web                                        | `apps/web/app/`                                                                 |
| Modifier un écran mobile                                     | `apps/mobile/`                                                                  |
| Générer des données de démo                                  | `apps/simulator/`                                                               |
| Ajouter un type partagé                                      | `packages/shared/src/`                                                          |

## 3. Lancer un seul test

```bash
pnpm --filter @lislestart/engine exec vitest run src/single-elimination.test.ts
pnpm --filter @lislestart/engine exec vitest -t "exempts"   # par nom de test
```

## 4. Ajouter un format de tournoi

1. Crée `packages/engine/src/<format>.ts` avec une fonction pure (participants + réglages en entrée, matchs en sortie).
2. Exporte-la dans `packages/engine/src/index.ts`.
3. Écris les tests à côté : `<format>.test.ts` (cas nominal, exempts, égalités).
4. Ajoute le format à `StageFormat` dans `packages/shared` et à l'enum Prisma.
5. Documente-le dans [tournament-formats.md](tournament-formats.md).

## 5. Ajouter un modèle de question Pick'em

1. Ajoute le modèle à `PickemTemplate` dans `packages/shared`.
2. Écris son résolveur dans `packages/engine/src/pickem/` : il reçoit les données du tournoi et renvoie la bonne réponse, ou « annulée » si une donnée manque.
3. Déclare les données dont il a besoin, pour que le constructeur ne le propose que si elles existent.
4. Teste le cas « donnée manquante ».

## 6. Lancer le mobile

```bash
pnpm --filter @lislestart/mobile start
```

Appuie sur `a` pour l'émulateur Android, ou scanne le QR code avec Expo Go sur un téléphone Android.

## Débuter

Les issues étiquetées `good first issue` dans GitHub Projects sont prévues pour une première contribution.
