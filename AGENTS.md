# AGENTS.md — Contexte du projet LisLeStart

Ce fichier donne à un assistant de code (Copilot, Claude Code, Cursor…) tout le contexte du projet.
À placer à la racine du dépôt. Copie identique possible dans `.github/copilot-instructions.md` et `CLAUDE.md`.

---

## 1. Le projet en bref

**LisLeStart** est une plateforme de **tournois** (dans l'esprit de start.gg) avec des **pronostics du public** (dans l'esprit du Pick'em de League of Legends).

- Projet pédagogique **EPIck'em**, PGE5 Epitech Paris 2026-2027, alternative au part-time en entreprise.
- **Groupe de 3** : Arslan, Enzo, Martin.
- **Période** : 19 octobre 2026 → soutenance fin janvier 2027 (rattrapage en février).
- Les administrateurs créent des tournois ou les **importent** depuis start.gg. Les joueurs s'inscrivent en solo ou en équipe, en présentiel ou à distance. Le public pronostique en direct.
- **Principe central** : chaque résultat de match, saisi sur la plateforme ou récupéré depuis start.gg, fait avancer l'arbre, résout automatiquement les pronostics et les Pick'em, et met à jour les classements **en temps réel**.

## 2. Règles d'or (non négociables, sanctionnées au jury)

1. **Marque originale** : rien du nom, du logo ou de l'interface de start.gg, de Riot Games / League of Legends, ni d'Epitech. Ne jamais écrire « start.gg » dans le nom du produit ou dans l'UI de marque.
2. **Aucun jeu d'argent** : aucune mise, aucun achat, aucun lot de valeur. Uniquement des **points, badges et titres**.
3. **API externes dans les règles** : start.gg selon ses conditions, données publiques uniquement, avec un lien vers la source.
4. **Aucune donnée personnelle réelle** sur la démo : comptes joueurs et spectateurs générés par le simulateur.
5. **Aucun secret** dans le dépôt ni dans l'historique (jeton start.gg compris).
6. **Mobile** : natif ou multiplateforme, **jamais** de site emballé (PWA, Ionic/Capacitor, Cordova, WebView).
7. **IA autorisée mais déclarée** : section « Usage de l'IA » du README à tenir à jour. Chaque membre doit pouvoir expliquer n'importe quelle partie du code en soutenance. Le code généré suit les mêmes règles (tests, revue, sécurité).

## 3. Équipe et répartition

| Pôle      | Responsable (GitHub)          | Périmètre                                                                                                                                                                                        |
| --------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Backend   | **Martin** (`martin-vergues`) | API NestJS, PostgreSQL/Prisma, moteur `packages/engine` (arbres, suisse, FFA, qualifications, départage), pronostics, Pick'em, recalcul en cascade, classements, temps réel, connecteur start.gg |
| Front web | **Enzo** (`EnzoDIWLK`)        | Next.js (React) : pages publiques, espace joueur, back-office admin, dashboard plein écran, vue liste des arbres, tests axe-core                                                                 |
| Mobile    | **Arslan** (`Wavitoo`)        | App React Native (Expo) : suivi en direct, pronostics, Pick'em, classements, groupes, notifications, TalkBack, APK en CI                                                                         |

Transversal (proposition) : CI/CD, Docker, déploiement et sécurité → Arslan (avec Martin pour auth/permissions) ; simulateur → Martin (génération) + Arslan (charge) ; charte et maquette Figma → Enzo ; démo, README, usage IA → les 3.

Dans `backlog/issues.json`, chaque issue porte un `pole` (`backend`, `web`, `mobile`, `transverse`) et des `owners` (prénoms traduits en identifiants GitHub par `backlog/team.json`). Les relecteurs sont demandés automatiquement via `.github/CODEOWNERS`.

**Contrat entre pôles = l'API** : le backend publie les endpoints dans OpenAPI avant de les coder ; web et mobile développent contre ce contrat (données simulées en attendant).

## 4. Stack technique

Monorepo **TypeScript** partout (pnpm workspaces + Turborepo).

| Brique            | Choix                                                                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Moteur de tournoi | `packages/engine` en TypeScript **pur** (aucune dépendance base/réseau), testé avec Vitest                                              |
| Types partagés    | `packages/shared`                                                                                                                       |
| API               | NestJS 11 + adaptateur Fastify, OpenAPI via `@nestjs/swagger` (servi sur `/docs`)                                                       |
| Base de données   | PostgreSQL 18 + Prisma 6 (`apps/api/prisma/schema.prisma`)                                                                              |
| Temps réel        | Socket.IO + adaptateur Redis (rooms par tournoi et par match)                                                                           |
| Jobs              | BullMQ sur Redis (synchro start.gg, verrouillage, recalcul en cascade, notifications)                                                   |
| Web               | Next.js 15 (App Router, React 19), sortie `standalone`                                                                                  |
| Mobile            | React Native 0.81 + Expo SDK 54, **cible officielle Android** (iOS en bonus seulement si Mac ou compte Apple dispo)                     |
| Tests             | Vitest partout ; Playwright + axe-core (web) ; k6 + simulateur (charge)                                                                 |
| Infra             | Docker Compose en local ; Render (API, web, région Frankfurt) + Neon (PostgreSQL), ADR 0004 — staging sur `main`, production sur `prod` |

Décisions justifiées dans `docs/adr/` (0001 monorepo, 0002 API, 0003 mobile, 0004 hébergement, 0005 recalcul par événements).

## 5. Structure du dépôt

```text
apps/
  api/         NestJS + Prisma + Socket.IO (src/, prisma/schema.prisma, prisma/seed.ts)
  web/         Next.js (app/, lib/)
  mobile/      Expo (App.tsx, src/, app.json, eas.json)
  simulator/   joueurs, équipes, matchs et pronostics fictifs (déterministe, graine SIMULATOR_SEED)
packages/
  engine/      logique pure : seeding, arbres, suisse, FFA, barèmes, Pick'em
  shared/      types : Role, StageFormat, Source, PickemTemplate, Participant
docs/          architecture, ADR, data-model, formats, pronostics, sécurité, accessibilité, connecteurs, exploitation, brand, guides utilisateur
backlog/       issues.json (73 issues, 7 sprints + bonus), team.json, README
scripts/       setup.sh (installation complète), create-github-backlog.mjs
.github/       workflows ci (dont déploiement), codeql, mobile ; templates ; dependabot ; CODEOWNERS
```

Noms de packages : `@lislestart/api`, `@lislestart/web`, `@lislestart/mobile`, `@lislestart/simulator`, `@lislestart/engine`, `@lislestart/shared`.

## 6. Commandes

Environnement de dev : **WSL Ubuntu** (pas PowerShell), Node 22 via nvm, pnpm 10 via corepack, Docker accessible depuis WSL. Projet dans `~/lislestart` (pas dans `/mnt/c`).

```bash
./scripts/setup.sh                          # installation complète (.env, deps, db, migrations, seed, api+web Docker)
docker compose up -d db redis               # seulement base + Redis
pnpm dev                                    # toutes les apps en watch
pnpm test                                   # tous les tests en une commande
pnpm lint                                   # ESLint + Prettier --check
pnpm typecheck                              # TypeScript
pnpm format                                 # Prettier --write

pnpm --filter @lislestart/api db:migrate --name <nom>   # nouvelle migration Prisma
pnpm --filter @lislestart/api db:seed                   # données de démo
pnpm --filter @lislestart/api db:studio                 # explorer la base
pnpm --filter @lislestart/engine exec vitest run src/<fichier>.test.ts
pnpm --filter @lislestart/mobile start                  # Expo, puis « a » pour l'émulateur Android
docker compose up -d --build api web                    # reconstruire les images
```

URL locales : web http://localhost:3000 · API http://localhost:4000 · santé `/health` · OpenAPI `/docs`.

Points d'attention connus :

- Le `.env` est **à la racine**. Les scripts Prisma de l'API le chargent via `dotenv -e ../../.env --` ; le dev de l'API via `tsx --env-file=../../.env`. Ne pas créer de `.env` dans `apps/api`.
- `.dockerignore` exclut `node_modules` : ne pas le retirer. Les Dockerfiles ont `ENV CI=true`.
- Toujours commiter `apps/api/prisma/migrations/`.

## 7. Conventions de travail

- **Trois branches longues, toutes protégées** (PR + 1 approbation + CI verte, pas de force push) :

  | Branche            | Rôle                                        | Alimentée par                          | Effet d'un merge               |
  | ------------------ | ------------------------------------------- | -------------------------------------- | ------------------------------ |
  | `dev` (par défaut) | Intégration                                 | PR des branches de travail, **squash** | CI                             |
  | `main`             | Version stable, tag SemVer en fin de sprint | PR `dev` → `main`, **merge commit**    | Déploiement _staging_ + APK    |
  | `prod`             | Production (démo de soutenance)             | PR `main` → `prod`, **merge commit**   | Déploiement _production_ + APK |

- **Une issue → une branche depuis `dev` → une PR vers `dev` relue → merge en squash.** Jamais de PR d'une branche de travail directement vers `main` ou `prod`.
- Branches de travail : `feat/<n°>-descriptif`, `fix/<n°>-…`, `docs/<n°>-…`, `chore/<n°>-…`. Correctif urgent : `hotfix/<n°>-…` depuis `main`, PR vers `main`, puis promotion vers `prod` et report dans `dev` (PR `main` → `dev`).
- **Conventional Commits** (vérifiés par commitlint) : `feat(engine): …`, `fix(api): …`, `docs(mobile): …`.
  Portées : `engine`, `api`, `web`, `mobile`, `simulator`, `shared`, `docs`, `ci`, `infra`, `deps`, `release`.
- PR : `Closes #n`, template rempli. Tag SemVer à chaque fin de sprint + CHANGELOG.
- **Définition de « terminé »** : testé, CI verte, utilisable au clavier/lecteur d'écran (UI), docs à jour, relu.
- Hooks : lint-staged + Gitleaks en pre-commit, commitlint en commit-msg.

Style de code : TypeScript strict (`noUncheckedIndexedAccess`), ESLint + Prettier (largeur 100, guillemets doubles, virgules finales). Le moteur reste **pur** : participants/événements en entrée, état en sortie, pas d'I/O. Textes d'interface et messages d'erreur **en français**.

## 8. Fonctionnalités attendues (cahier des charges)

### Profils

- **Administrateur** : seul à créer du contenu (jeux et stats, tournois internes, imports start.gg, pronostics, Pick'em). Valide les scores, tranche les litiges, modère.
- **Joueur** : inscription solo ou équipe (création, invitations), check-in, déclare scores et stats de partie, suit son parcours.
- **Spectateur** : pronostique, répond aux Pick'em, suit en direct, rejoint des groupes d'amis. Tout utilisateur connecté (joueur compris) peut pronostiquer.

### Tournois internes

- Jeux déclarés par l'admin (e-sport, plateau, babyfoot, échecs…) avec **statistiques par manche** (personnage dans une liste, carte, kills, buts, MVP…).
- Création : jeu, dates, lieu (en ligne/présentiel/mixte), visibilité (public/invitation), description, règlement ; solo ou équipe (taille min/max, titulaires/remplaçants) ; duplication et modèles.
- Inscriptions ouvertes ou sur validation, places, liste d'attente, champs personnalisés. Équipes : capitaine, invitation par lien. Check-in sur plage horaire, absents remplacés par la liste d'attente.
- **Formats d'étape** : élimination simple/double (exempts), poules (round robin), ronde suisse (sans rematch, Buchholz), FFA (points de placement).
- Qualifications entre étapes (1er de A contre 2e de B…), BO1/BO3/BO5 par tour, barème de points, départage (confrontation directe, différence de manches, Buchholz), seeding manuel ou auto.
- **Import CSV/JSON** documenté (participants, équipes, seeding, résultats), validé ligne par ligne, aperçu, annulation ; déclenche la même mécanique qu'une saisie.
- Planification (heure, durée, poste/table/terrain), notifications. Résultats saisis par l'admin ou **déclarés avec double confirmation** ; désaccord → **litige** avec preuve, l'admin tranche. Forfaits, disqualifications, retards. Pages publiques : arbres, classements, planning, participants.

### Import start.gg

- Appel direct à l'API publique (URL collée ou recherche par nom) : phases, arbres, participants, matchs, manches, personnages, cartes, seeds, classements quand disponibles.
- Synchronisation régulière avec cache et respect des limites de requêtes. Tournoi importé en **lecture seule** (on peut pronostiquer dessus).
- **Architecture en connecteurs** : start.gg seul livré, une autre source branchable sans modifier le cœur.

### Pronostics

- Modes par tournoi/phase : **match par match** (vainqueur, score exact) et/ou **arbre complet** avant la phase.
- **Verrouillage automatique sur l'horloge du serveur** au début du match ou de la phase.
- Barème configurable (points, bonus score exact, points croissants dans l'arbre).
- Visibles après verrouillage : pronostics des amis, **répartition du public** (« 72 % voient l'équipe A gagner »).

### Pick'em personnalisés

- 5 modèles : le plus choisi · le meilleur sur une statistique · un total/nombre · classement (vainqueur, top 8, plus grosse surprise) · oui/non.
- Par question : barème, date de clôture, données de résolution. **Résolution automatique**.
- Le constructeur ne propose que les questions **réellement résolubles** avec les données du tournoi. Donnée manquante → question **annulée** et participants informés.

### Résultats, recalcul, classements

- Chaque résultat met à jour arbre, pronostics, Pick'em, classements en temps réel.
- **Recalcul en cascade** après correction/litige/synchro, historique conservé (résultats stockés comme `ResultEvent`, état recalculé depuis l'historique — ADR 0005).
- Classements par tournoi, saison, général ; **groupes privés** entre amis ; badges et titres.

### Dashboard en direct (web, projetable plein écran en LAN)

Matchs en cours/à venir/derniers résultats, arbre ou classement en temps réel, classement des pronostiqueurs (général, tournoi, groupe), statistiques (répartition, taux de réussite par question Pick'em).

### Application mobile (pôle d'Arslan)

- Périmètre : suivre les tournois en cours (arbres et résultats en direct), pronostiquer, répondre aux Pick'em, consulter classements et groupes.
- **Notifications** : pronostic bientôt verrouillé, résultat d'un match suivi, points gagnés.
- Une seule plateforme : Android (APK produit par la CI à chaque merge sur `main`). Pas de publication store : démo sur téléphone ou émulateur.
- Accessibilité : TalkBack, tailles de texte dynamiques, zones tactiles ≥ 48 dp, `accessibilityLabel`/`accessibilityRole` partout, états jamais portés par la seule couleur.
- Écrans prévus (maquette) : Pronos (match en cours, prochain match, choix vainqueur + score, bouton valider), Pick'em (progression, questions à choix), Classement (général/tournoi/groupe, ma position, badges, inviter des amis), Arbres. Barre d'onglets : Pronos · Pick'em · Arbres · Classement.

### Simulateur et démonstration

- Génère joueurs, équipes, spectateurs fictifs, joue les matchs avec des stats réalistes, produit des pronostics, en accéléré ou temps réel. Sert aussi aux **tests de charge** (milliers de spectateurs sur un même match).
- Démo attendue : **3 tournois internes** de formats différents (ronde suisse, double élimination, FFA) + **2 tournois importés** depuis start.gg avec Pick'em résolus.
- Bonus (non obligatoires) : format ligue, widgets intégrables, second connecteur, prédictions assistées, Pick'em depuis un chat de stream.

## 9. Exigences de qualité (comptent autant que les fonctionnalités)

### Accessibilité — WCAG 2.2 AA (RGAA), web ET mobile

Clavier partout (y compris saisie d'un arbre complet), focus visible ; **vue alternative équivalente** (liste/tableau) pour chaque arbre ; HTML sémantique, titres hiérarchisés, libellés ; mises à jour en direct annoncées sans submerger (`aria-live="polite"`) ; contraste 4,5:1, info jamais portée par la seule couleur ; erreurs de formulaire explicites liées au champ avec suggestion ; zoom 200 %, `prefers-reduced-motion`. Preuves : audit (Lighthouse, axe, WAVE + clavier + NVDA/TalkBack) et **déclaration d'accessibilité** sur la plateforme.

### Dépôt

- **Test du nouvel arrivant** : un externe clone, lance la plateforme avec un tournoi simulé et les tests **en moins de 15 minutes** avec le seul README.
- GitHub Projects configuré et tenu à jour ; issues avec responsable, label, statut, milestone.
- Fichiers : README (captures, prérequis, install, tests, liens docs), CONTRIBUTING, LICENSE, CHANGELOG, CODE_OF_CONDUCT, templates `.github/`, `.env.example`, `.gitignore`.
- Arborescence propre, pas de code mort ; lockfile ; dépendances à jour.

### Sécurité et robustesse

- **Intégrité des pronostics** : verrouillage serveur, aucune modification après le début d'un match.
- **Journal d'audit** (append-only) : correction de score, décision de litige, création et résolution de Pick'em.
- Permissions vérifiées côté serveur, mots de passe hachés (Argon2id), sessions sécurisées (cookies HttpOnly/Secure/SameSite), **Top 10 OWASP**, rate limiting.
- Plateforme utilisable quand start.gg ne répond pas (cache affiché, reprise automatique).
- Tests de charge documentés.

### Tests (minimum exigé)

Génération des arbres pour chaque format (avec exempts), appariement suisse, points FFA, qualifications, seeding et départage, verrouillage des pronostics, barème, **résolution des Pick'em (y compris données manquantes)**, **recalcul en cascade**, connecteur start.gg (**mocké**, tests hors ligne). Le mobile a ses propres tests (logique et interface). **Une seule commande** : `pnpm test`.

### CI/CD (obligatoire)

CI à chaque PR (lint, tests web/serveur/mobile, build) ; PR non mergeable si la CI échoue ; déploiement continu à chaque merge sur `main` ; **build mobile installable** en artefact (APK) ; secrets dans GitHub Secrets ; pipeline documenté + badge dans le README.
Workflows en place : `ci.yml` (Gitleaks, lint, typecheck, test, build, `pnpm audit` — sur `dev`, `main`, `prod`), `codeql.yml`, job `deploy` de `ci.yml` (hooks Render après les checks : `main` → environnement GitHub `staging`, `prod` → `production`), `mobile.yml` (APK via `expo prebuild` + Gradle sur `main` et `prod`).

## 10. Documentation à produire (dans `/docs`, en Markdown)

- **Utilisateur** (non technique) : admin, joueur, spectateur.
- **Technique** : architecture (schéma), ADR, modèle de données (entités + dictionnaire), formats de tournoi, pronostics et Pick'em, temps réel, API (OpenAPI + exemples), application mobile (architecture, notifications, échanges API, lancement, build), exploitation (déploiement, CI/CD, résultats charge et audit a11y).
- **Guide du développeur de connecteurs** : interface, correspondance des données, synchro, limites d'API, **tutoriel complet** d'un connecteur simple.

## 11. Modèle de données (résumé Prisma)

`User` (role ADMIN/PLAYER/SPECTATOR) · `Game` → `StatDefinition` · `Tournament` (source INTERNAL/FILE_IMPORT/STARTGG, externalId, readOnly) → `Stage` (format, settings JSON) → `Match` (round, bestOf, status, `startedAt` = verrouillage, slots JSON) → `MatchGame` (stats) · `ResultEvent` (historique des résultats) · `Team` → `TeamMember` · `Prediction` (unique user+match) · `PickemQuestion` (template, config, points, closesAt, status open/locked/resolved/cancelled) → `PickemAnswer` · `AuditLog` (actor, action, target, before, after).
À ajouter : groupes d'amis, badges, litiges, inscriptions et champs personnalisés, classements.

## 12. Identité visuelle (maquettes Claude + Figma)

- Couleurs : Nuit `#0F1222` (fond), Surface `#181C30`, Raised `#1F2440`, Bordure `#2A3050`/`#3A4168`, Craie `#F2F4FA` (texte), texte secondaire `#C9CEE0`, muted `#A3AAC2`, **Lime `#C6F432`** (actions, direct, focus), **Violet `#8B7BFF`** (pronostics), **Corail `#FF8A65`** (alertes).
- Polices : Barlow Condensed gras capitales (titres, scores), Manrope (texte), JetBrains Mono (chiffres, points, horaires).
- Composants : boutons primaire (lime, texte nuit) / secondaire (bordure), chips d'état avec **icône + mot** (Prono juste ✓, Prono faux ✕, Verrouillé, En direct), cases d'équipe (défaut, sélectionnée, désactivée).
- Thème sombre, coins arrondis 10–20 px, cibles ≥ 48 px.

## 13. Planning

| Sprint | Dates         | Objectif                                                                                                                                        |
| ------ | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| S0     | 19/10 → 01/11 | Charte, monorepo, Docker, CI, GitHub Projects, ADR, modèle de données, squelette mobile                                                         |
| S1     | 02/11 → 15/11 | Auth et rôles, jeux et stats, tournois, inscriptions, check-in, élimination simple/double, saisie résultats, pages publiques, navigation mobile |
| S2     | 16/11 → 29/11 | Poules, suisse, FFA, qualifications, seeding, déclaration et litiges, import CSV/JSON, temps réel, événements de résultat                       |
| S3     | 30/11 → 13/12 | Pronostics match et arbre, verrouillage serveur, barème, connecteur start.gg, écrans mobiles suivi + pronostics                                 |
| S4     | 14/12 → 03/01 | Pick'em (5 modèles, résolution, annulation), recalcul en cascade, classements, groupes, badges, dashboard                                       |
| S5     | 04/01 → 17/01 | Simulateur complet, charge k6, notifications mobiles, audit a11y, revue OWASP. **Gel des fonctionnalités le 17/01**                             |
| S6     | 18/01 → 24/01 | Docs, déclaration d'accessibilité, test du nouvel arrivant, répétition                                                                          |
| —      | fin janvier   | **Soutenance** : tournoi simulé en direct, le jury pronostique sur mobile, import start.gg, parcours accessible, questions sur le code          |

Follow-up facultatif courant décembre. Backlog détaillé : `backlog/issues.json`.

## 14. Consignes pour l'assistant

- Respecte les règles d'or (section 2) en toute circonstance.
- Écris du TypeScript strict, testé ; ajoute ou mets à jour les tests avec chaque changement de logique.
- Garde `packages/engine` pur et déterministe.
- Toute vérification de permission ou de verrouillage se fait **côté serveur**, jamais seulement côté client.
- Ne mets jamais de secret, de jeton ou de donnée personnelle réelle dans le code, les tests ou les fixtures.
- UI : accessible par défaut (rôles, libellés, focus, contraste, pas d'info portée par la seule couleur).
- Mets à jour la doc concernée dans `/docs` et l'OpenAPI dans la même PR.
- Messages de commit au format Conventional Commits, avec la bonne portée.
- En cas de doute sur une règle du sujet, préfère l'option la plus stricte et signale-le.
