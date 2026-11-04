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
| `src/lib/`        | Logique pure testée avec Vitest (libellés, tournois en cours, verrouillage)                |
| `src/components/` | Composants d'interface réutilisables                                                       |
| `src/screens/`    | Un écran par onglet                                                                        |

Onglets : **Pronos · Pick'em · Arbres · Classement**. L'app s'ouvre sur Arbres, qui liste les tournois en cours. Les trois autres onglets arrivent aux sprints 3 et 4.

## Échanges avec l'API

Le mobile développe contre le contrat ci-dessous ; les types sont dans `packages/shared` (`TournamentListResponse`, `TournamentSummary`).

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

### Temps réel

Les résultats en direct arrivent par Socket.IO (`match:updated`, `standings:updated`) après abonnement à un tournoi ou à un match : voir [realtime.md](realtime.md). Les écrans de suivi s'y brancheront avec les pronostics (sprint 3).

## Accessibilité

- Chaque carte de tournoi est un seul élément TalkBack, avec une phrase complète (nom, jeu, « en direct », lieu, participants, origine).
- Badge « En direct » : point lime **et** mot. Onglet actif : icône pleine **et** couleur, état « sélectionné » annoncé par la navigation.
- Messages de chargement, d'erreur et de liste vide annoncés (`accessibilityLiveRegion="polite"`).
- Cibles de 48 dp minimum, tailles de texte système respectées (pas de `maxFontSizeMultiplier`).
