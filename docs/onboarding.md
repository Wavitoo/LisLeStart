# Prise en main

Objectif : un nouveau contributeur lance la plateforme, un tournoi simulé et les tests en moins de 15 minutes.

## 1. Installer (5 min)

```bash
git clone https://github.com/OWNER/lislestart.git && cd lislestart
./scripts/setup.sh
```

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
