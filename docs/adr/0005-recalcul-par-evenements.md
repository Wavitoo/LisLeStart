# 0005 — Résultats en événements et recalcul en cascade

- Statut : accepté
- Date : 2026-10-25

## Contexte

Un score corrigé après un litige ou une synchronisation start.gg doit recalculer l'arbre, les qualifiés et les points de tous les spectateurs, en gardant une trace.

## Options envisagées

1. Modifier les données en place : simple, mais l'historique se perd et les recalculs partiels sont fragiles.
2. Enregistrer chaque résultat comme un événement (`ResultEvent`) et recalculer l'état à partir de l'historique.

## Décision

Option 2 : chaque résultat est un événement horodaté avec sa source. Le moteur rejoue les événements d'une étape pour produire l'état courant ; les points sont recalculés par un job.

## Conséquences

- L'historique garde la trace de chaque correction (exigence du sujet).
- Le moteur reste pur et testable : événements en entrée, état en sortie.
- Un recalcul complet doit rester rapide : à mesurer avec les tests de charge.
