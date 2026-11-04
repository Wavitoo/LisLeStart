# Application mobile

App Android en React Native + Expo SDK 54 ([ADR 0003](adr/0003-mobile-react-native-expo.md)), dans `apps/mobile`.

## Lancer

```bash
pnpm --filter @lislestart/mobile start        # puis « a » pour l'émulateur Android
pnpm --filter @lislestart/mobile test
```

Sans configuration, l'app affiche des **données de démonstration** (mention visible à l'écran). Pour viser l'API locale depuis l'émulateur Android, où `10.0.2.2` désigne la machine hôte :

```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000 pnpm --filter @lislestart/mobile start
```

## Architecture

| Dossier / fichier | Rôle                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------ |
| `App.tsx`         | Polices, thème de navigation, barre d'onglets                                              |
| `src/theme.ts`    | Couleurs, espacements, rayons et typographie de la charte Seedline                         |
| `src/api/`        | Client HTTP (`client.ts`), données simulées (`mock.ts`), choix entre les deux (`index.ts`) |
| `src/auth/`       | Session partagée par toute l'app (`AuthContext.tsx`)                                       |
| `src/realtime/`   | Client Socket.IO partagé (`realtime.ts`), direct simulé (`mock.ts`)                        |
| `src/lib/`        | Logique pure testée avec Vitest (libellés, tournois en cours, verrouillage, pronostics)    |
| `src/components/` | Composants d'interface réutilisables                                                       |
| `src/screens/`    | Un écran par onglet                                                                        |

Onglets : **Pronos · Pick'em · Arbres · Classement**. L'app s'ouvre sur Arbres, qui liste les tournois en cours. Pronos montre le match en cours et le prochain match à pronostiquer. L'icône en haut à droite de chaque onglet ouvre **Compte** : connexion, inscription (joueur ou spectateur) ou profil et déconnexion. Pick'em et Classement arrivent au sprint 4.

## Échanges avec l'API

Le mobile développe contre le contrat ci-dessous ; les types sont dans `packages/shared` (`TournamentListResponse`, `PredictionFeedResponse`, `PredictionInput`…).

Les endpoints de pronostic sont un **contrat proposé par le mobile**, à valider par le backend avant son implémentation. En attendant, les données simulées le respectent, verrouillage compris.

### `GET /tournaments?status=live`

Tournois publics en cours (début ≤ heure serveur < fin), du plus récemment commencé au plus ancien. `serverTime` est l'heure du serveur, seule référence pour les comptes à rebours et le verrouillage.

```json
{
  "serverTime": "2026-11-14T15:00:00.000Z",
  "tournaments": [
    {
      "id": "clx…",
      "name": "Coupe d'hiver",
      "game": "Rocket League",
      "source": "internal",
      "location": "onsite",
      "startsAt": "2026-11-14T13:00:00.000Z",
      "endsAt": "2026-11-14T19:00:00.000Z",
      "participantCount": 16
    }
  ]
}
```

Erreurs : réseau injoignable ou réponse non 2xx → message en français et bouton « Réessayer ». Délai maximal d'une requête : 10 s.

### Compte

L'écran Compte utilise les routes d'authentification existantes (`POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, voir [security.md](security.md)). Le cookie de session est gardé par la pile réseau d'Android entre les requêtes et les redémarrages de l'app. Les erreurs par champ de l'API (`errors: [{ field, message }]`) s'affichent sous le champ concerné et sont lues par TalkBack avec lui. Un administrateur se connecte comme tout le monde ; l'inscription ne propose que joueur ou spectateur.

En données de démonstration, un compte fictif est prêt (`demo@seedline.test`, bouton « Remplir avec le compte de démo ») et les comptes créés restent en mémoire jusqu'au redémarrage de l'app.

### `GET /predictions/feed`

Matchs en cours et à venir des tournois en cours. Public : `myPrediction` vaut `null` sans session. Sans compte, le bouton du prono devient « Se connecter pour pronostiquer » et ouvre l'écran Compte. `distribution` (part du public) reste `null` tant que le match n'est pas verrouillé, pour ne pas influencer les pronostics.

```json
{
  "serverTime": "2026-11-14T15:00:00.000Z",
  "matches": [
    {
      "id": "clx…",
      "tournamentId": "clx…",
      "tournamentName": "Coupe d'hiver",
      "roundLabel": "Demi 2",
      "bestOf": 3,
      "status": "scheduled",
      "locksAt": "2026-11-14T15:12:00.000Z",
      "slots": [
        { "participantId": "clx…", "name": "Les Renards", "score": null },
        { "participantId": "clx…", "name": "Team Nova", "score": null }
      ],
      "myPrediction": null,
      "distribution": null,
      "predictionCount": 912
    }
  ]
}
```

- `locksAt` : début du match (`Match.startedAt` ou heure planifiée). Le pronostic est fermé à partir de cette heure, ou dès que `status` n'est plus `scheduled` ni `called`.
- Un emplacement à déterminer a `participantId` et `name` à `null` : le match n'est pas encore pronostiquable.

### `PUT /matches/:id/prediction` (connecté)

Crée ou remplace le pronostic. Corps et réponse : `{ "winnerId": "clx…", "score": [2, 1] }`. `score` est facultatif (`null`), dans l'ordre des emplacements, et absent en BO1.

| Code | Cas                                         | Message affiché                            |
| ---- | ------------------------------------------- | ------------------------------------------ |
| 200  | Pronostic enregistré                        | « Prono enregistré : Les Renards, 2 – 1. » |
| 400  | Vainqueur absent du match, score incohérent | message du serveur                         |
| 401  | Pas de session                              | « Connecte-toi pour pronostiquer. »        |
| 409  | Match commencé (horloge du serveur)         | « Prono fermé : le match a commencé. »     |

### Temps réel

L'écran Pronos suit en Socket.IO les tournois des matchs affichés (`match:updated`, voir [realtime.md](realtime.md)) : le score du match en cours change sans recharger, puis la carte passe à « Dernier résultat » avec « Score exact » (vainqueur et score), « Prono juste » (vainqueur seulement, avec le score exact manqué) ou « Prono faux ». Une seule connexion est partagée par l'app ; les abonnements sont refaits à chaque reconnexion. En données de démonstration, la Demi 1 se termine 20 s après l'ouverture de Pronos ; la Demi 2 se ferme 2 min après le lancement de l'app, passe en direct, puis se termine 30 s plus tard. La section « Mes pronos » liste tous les pronos de l'utilisateur avec leur état (modifiable, verrouillé, score exact, juste, faux) : un prono ne disparaît jamais de l'écran.

### Heure du serveur

Le téléphone peut avoir une horloge fausse. L'écart avec `serverTime` est mesuré à chaque chargement et appliqué au compte à rebours (`serverClock` dans `src/lib/lock.ts`). Ce n'est qu'un affichage : seul le serveur décide du verrouillage.

## Accessibilité

- Chaque carte de tournoi est un seul élément TalkBack, avec une phrase complète (nom, jeu, « en direct », lieu, participants, origine).
- Badge « En direct » : point lime **et** mot. Onglet actif : icône pleine **et** couleur, état « sélectionné » annoncé par la navigation.
- Messages de chargement, d'erreur et de liste vide annoncés (`accessibilityLiveRegion="polite"`).
- Pronos : choix du vainqueur et du score en boutons radio (`accessibilityRole="radio"`, état « sélectionné »), avec bordure, coche **et** « Mon choix ». Score du match en cours annoncé à chaque changement, sans voler le focus. Le bouton désactivé dit pourquoi (« Choisis un vainqueur », « Prono fermé », « Prono enregistré »).
- Répartition du public lue comme une phrase (« 72 % voient Les Hiboux gagner, 28 % Kraken Club »), pourcentages écrits à côté des barres.
- Cibles de 48 dp minimum, tailles de texte système respectées (pas de `maxFontSizeMultiplier`).
