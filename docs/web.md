# Application web

Next.js 15 (App Router), rendu côté serveur. Styles : Tailwind v4 avec les jetons de la maquette Figma dans `apps/web/app/globals.css` (couleurs, polices, rayons, styles de texte `type-*`).

## Pages

| Route                        | Accès          | Contenu                                                               |
| ---------------------------- | -------------- | --------------------------------------------------------------------- |
| `/`                          | public         | Accueil : salutation et tournois à suivre                             |
| `/tournois`                  | public         | Tournois publics par statut (`?statut=direct`, `a-venir`, `termines`) |
| `/tournois/[id]`             | public         | Page d'un tournoi : arbre, participants, planning, classement         |
| `/connexion`, `/inscription` | public         | Connexion et création de compte (joueur ou spectateur)                |
| `/admin/tournois/nouveau`    | administrateur | Création de tournoi                                                   |

## Gabarit

- Pages publiques et back-office partagent `AppShell` (`components/site/app-shell.tsx`) : barre latérale de la maquette (sections, lien actif en `aria-current="page"`, carte profil avec déconnexion), repliée derrière un bouton « Menu » sous 1024 px. `SiteShell` la remplit pour le public, `AdminShell` pour l'administration. Seules les pages livrées y figurent.
- Icônes : SVG exportés de la maquette dans `public/icons`, toujours décoratives (`Icon` garde leur couleur, `TintedIcon` prend celle du texte).
- Statut d'un tournoi (en direct, à venir, terminé) : déduit des dates par `tournamentStatus`, à l'heure du serveur Next.

## Connexion et inscription

- Mise en page de la maquette : panneau de marque à gauche (masqué sous 1024 px), formulaire à droite, bascule « Se connecter / Créer un compte » qui garde `?suite=`.

- Formulaires react-hook-form + zod, mêmes règles que l'API (`lib/auth/schema.ts`). Erreurs sous le champ (`aria-describedby`, `aria-invalid`) et récapitulatif focalisé ; les refus de l'API sont rattachés au bon champ (email déjà utilisé, validation) ou affichés en alerte (identifiants incorrects, trop de tentatives).
- Champs `autocomplete` (`email`, `username`, `current-password`, `new-password`) et bouton « Afficher le mot de passe ».
- Les actions serveur (`lib/auth/actions.ts`) posent le cookie de session sur le domaine du site : voir [security.md](security.md#authentification-et-sessions).
- `?suite=/chemin` ramène à la page demandée après connexion ; un compte déjà connecté est redirigé.
- Avec `API_MOCK=true`, comptes et sessions sont simulés en mémoire, avec un administrateur fictif `admin@seedline.test` / `demo-seedline-admin` (développement et tests uniquement, jamais en production).

## Page publique d'un tournoi

- L'en-tête du tournoi est chargé avant tout envoi : un tournoi inconnu ou privé répond **404**. Les quatre sections arrivent ensuite en streaming, chacune avec son état de chargement (`<Suspense>`), son état vide et son état d'erreur : une section en panne n'empêche pas d'afficher les autres.
- Navigation interne par ancres (`#arbre`, `#participants`, `#planning`, `#classement`) : toutes les sections sont dans la page, l'adresse reflète la section.
- Arbre : bascule « Graphique / Liste » en onglets Radix (contrôle segmenté de la maquette). La vue liste est un tableau par tour (légende « Quarts de finale · 4 matchs », colonnes Match, Horaire, Participant 1, Participant 2, Score, Vainqueur, Format, État) : mêmes informations que les cartes de l'arbre. Chaque match de l'arbre a un nom accessible complet, par exemple « Quart de finale 1 : Les Hiboux 2, Brise-Glace 0, Les Hiboux gagne ».
- Titres : un `h1` (le tournoi), un `h2` par section, puis `h3` par tour (élimination simple) ou par partie d'arbre (tableau principal, repêchage, grande finale) avec `h4` par tour.
- La colonne latérale « Mon pronostic » et le Pick'em de la maquette sont prévus (`TournamentLayout`, prop `aside`) mais pas encore livrés.

## Contrat d'API (lecture publique, sans session)

Types dans `packages/shared`. Tant que ces routes n'existent pas côté API, le web les simule : `API_MOCK=true` (ignoré en production) branche `createMockPublicApi()` sur trois tournois fictifs (`coupe-hiver`, `open-echecs`, `ligue-babyfoot`).

| Route                               | Réponse                          | Notes                                                   |
| ----------------------------------- | -------------------------------- | ------------------------------------------------------- |
| `GET /tournaments`                  | `TournamentListResponse`         | Déjà décrit dans [mobile.md](mobile.md)                 |
| `GET /tournaments/:id`              | `TournamentDetail`               | 404 si inconnu ou non public                            |
| `GET /tournaments/:id/bracket`      | `TournamentBracketResponse`      | Voir [mobile.md](mobile.md), avec les ajouts ci-dessous |
| `GET /tournaments/:id/participants` | `TournamentParticipantsResponse` | Tête de série, joueurs inscrits (équipes), check-in     |
| `GET /tournaments/:id/schedule`     | `{ matches: ScheduledMatch[] }`  | Tous formats ; heure, tour, poste, état, score          |
| `GET /tournaments/:id/standings`    | `{ stages: StageStandings[] }`   | Par étape, puis par poule ; `points` null pour un arbre |

Ajouts au contrat de l'arbre, tous facultatifs (le mobile n'est pas touché) :

- `BracketRound.side` : `winners`, `losers` ou `grand_final` en élimination double ; absent en élimination simple. Les tours d'une même partie se suivent.
- `BracketSlot.placeholder` (et le même champ dans les emplacements de `ScheduledMatch`) : origine d'un emplacement à déterminer, par exemple « Vainqueur demie 1 », « Perdant demie 2 ».
- `BracketMatch.station` : poste, table ou terrain.

Exempt : `isBye: true`, le match est `done` et `winnerId` désigne l'autre participant.

## Tests

- `pnpm --filter @lislestart/web test` : Vitest (schémas, formats, composants avec Testing Library).
- `pnpm --filter @lislestart/web test:e2e` : Playwright + axe-core (WCAG 2.2 A/AA), avec l'API simulée. Installer le navigateur une fois : `pnpm --filter @lislestart/web exec playwright install chromium`.
