# Formats de tournoi

Un tournoi est une suite d'étapes, chacune avec son format. Toute la logique vit dans `packages/engine`.

| Format                                | Statut                         | Code                    |
| ------------------------------------- | ------------------------------ | ----------------------- |
| Élimination simple (avec exempts)     | Sprint 0 : premier tour généré | `single-elimination.ts` |
| Élimination double                    | Sprint 1                       |                         |
| Poules (round robin)                  | Sprint 2                       |                         |
| Ronde suisse (sans rematch, Buchholz) | Sprint 2                       |                         |
| FFA (points de placement)             | Sprint 2                       |                         |

## Seeding

Placement standard : les têtes de série 1 et 2 ne peuvent se croiser qu'en finale. Pour 8 places : `1-8, 4-5, 2-7, 3-6`. Les exempts vont aux meilleures têtes de série.

## À documenter par format

- Génération des matchs et des tours.
- Réglages : BO par tour, barème (victoire, nul, défaite, placement en FFA).
- Départage : confrontation directe, différence de manches, Buchholz.
- Qualification vers l'étape suivante (ex. 1er de A contre 2e de B).
