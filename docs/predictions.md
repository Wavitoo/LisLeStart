# Pronostics et Pick'em

## Pronostics

| Mode            | Contenu                          | Verrouillage                          |
| --------------- | -------------------------------- | ------------------------------------- |
| Match par match | Vainqueur, score exact en option | Au début du match (`Match.startedAt`) |
| Arbre complet   | Tous les vainqueurs d'une phase  | Au début de la phase                  |

Le verrouillage est vérifié par l'API sur l'horloge du serveur : un pronostic envoyé après le début est refusé, quel que soit l'affichage côté client.

## Barème (configurable par l'administrateur)

Points par bonne réponse, bonus pour le score exact, points croissants à mesure qu'on avance dans l'arbre.

## Pick'em

| Modèle                          | Exemple                                | Données nécessaires                                |
| ------------------------------- | -------------------------------------- | -------------------------------------------------- |
| Le plus choisi                  | Carte la plus jouée                    | Statistique de type choix, relevée à chaque manche |
| Le meilleur sur une statistique | Le plus de kills, MVP                  | Statistique numérique ou joueur                    |
| Un total ou un nombre           | Matchs en manche décisive              | Résultats des matchs                               |
| Classement                      | Vainqueur, top 8, plus grosse surprise | Classement final et seeds                          |
| Oui / non                       | Un 3-0 en finale ?                     | Résultats des matchs                               |

Le constructeur ne propose que les questions réellement résolubles avec les données du tournoi. Si une donnée manque à la fin, la question est annulée et les participants sont prévenus.

## Recalcul en cascade

Voir [ADR 0005](adr/0005-recalcul-par-evenements.md).
