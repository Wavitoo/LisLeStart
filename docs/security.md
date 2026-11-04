# Sécurité

Synthèse dans [SECURITY.md](../SECURITY.md). Ce document détaille les choix et sert de checklist pour la revue OWASP du sprint 5.

## Checklist Top 10 OWASP (2021)

| Risque                     | Mesure prévue                                                                                                  | Statut             |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------ |
| A01 Contrôle d'accès       | Garde globale (toute route exige une session sauf `@Public()`), `@Roles()`, `assertOwnerOrAdmin` contre l'IDOR | Fait               |
| A02 Cryptographie          | Argon2id (19 Mio, t=2, p=1), HTTPS en ligne, cookies `Secure` en production                                    | Fait               |
| A03 Injection              | Prisma (requêtes paramétrées), validation des entrées, import CSV/JSON au schéma strict                        | À faire            |
| A04 Conception             | Verrouillage serveur des pronostics, journal d'audit                                                           | Partiel (journal)  |
| A05 Configuration          | En-têtes de sécurité, CORS restreint, pas de stack trace en production                                         | Partiel (web)      |
| A06 Composants vulnérables | Dependabot, `pnpm audit` en CI                                                                                 | Fait               |
| A07 Authentification       | Sessions Redis révocables, cookie `HttpOnly` `SameSite`, 5 tentatives/min, pas de fixation de session          | Fait               |
| A08 Intégrité              | Lockfile, CI obligatoire avant merge, secrets dans GitHub                                                      | Fait               |
| A09 Journalisation         | Journal d'audit en ajout seul, logs sans données sensibles                                                     | Fait (trigger SQL) |
| A10 SSRF                   | Connecteurs limités à des URL autorisées (start.gg)                                                            | À faire            |

## Authentification et sessions

- **Endpoints** : `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` (détail dans OpenAPI, `/docs`). L'inscription ne propose que joueur ou spectateur : aucune route ne permet de devenir administrateur. La création du premier administrateur (commande ou seed, sans mot de passe dans le dépôt) reste à faire.
- **Mots de passe** : Argon2id aux paramètres minimaux de l'OWASP. Un email inconnu coûte le même temps qu'un mauvais mot de passe, avec le même message (« Email ou mot de passe incorrect. »).
- **Sessions** : identifiant aléatoire de 256 bits dans le cookie `sid`. Redis ne stocke qu'un HMAC de cet identifiant (clé `SESSION_SECRET`) : une copie de Redis ne donne aucun cookie valide. Durée de vie glissante de 7 jours, nouvelle session à chaque connexion, suppression à la déconnexion.
- **Cookie** : `HttpOnly`, `SameSite=Lax` par défaut (`COOKIE_SAME_SITE`), `Secure` en production ou avec `SameSite=None`.
- **CSRF** : `SameSite` et corps JSON obligatoire ; un formulaire HTML venu d'un autre site est refusé.
- **Limitation de débit** : 120 requêtes par minute et par IP, 5 sur l'inscription et la connexion. Derrière le proxy de l'hébergeur, `TRUST_PROXY=true` pour lire la vraie IP.
- **Erreurs de validation** : `400` avec une entrée par champ (`errors: [{ field, message }]`), à afficher à côté du champ ; les champs inconnus sont refusés.

En ligne, le web et l'API sont sur deux sous-domaines de `onrender.com`, que les navigateurs traitent comme deux sites distincts : un cookie `Lax` n'y est pas envoyé par `fetch`. Deux options : faire passer les appels du web par un proxy (réécriture `/api` vers l'API dans Next.js, recommandé), ou `COOKIE_SAME_SITE=none`.

## Journal d'audit

`AuditService.record()` (module global) enregistre l'auteur, l'action, la cible, l'état avant, l'état après et la date, de préférence dans la transaction de l'action décrite. Actions : `score.corrected`, `dispute.decided`, `pickem.created`, `pickem.resolved`, `pickem.cancelled`. Lecture réservée aux administrateurs : `GET /audit` (filtres `target` et `action`, pagination par curseur).

Ajout seul, garanti à deux niveaux : le service n'expose ni modification ni suppression, et un trigger PostgreSQL (migration `audit_log_append_only`) refuse `UPDATE`, `DELETE` et `TRUNCATE` sur `AuditLog`, quel que soit le code qui les tente. Un compte qui a des entrées ne peut pas être supprimé (clé étrangère `RESTRICT`).

## Secrets

- Jamais dans le dépôt ni dans l'historique : `.env` ignoré, Gitleaks en pre-commit et en CI.
- Jeton start.gg : variable `STARTGG_API_TOKEN`, secret GitHub en CI (les tests utilisent des mocks).

## Dépendances : correctifs et exceptions

`pnpm audit --prod --audit-level high` tourne en CI. Les failles corrigeables le sont par une montée de version ou un `pnpm.overrides` dans le `package.json` racine (`fastify`, `postcss`).

Exceptions acceptées (`pnpm.auditConfig.ignoreGhsas`), toutes limitées aux **outils de build**, jamais exécutées dans l'API, le web déployé ni l'APK :

| Avis                  | Paquet         | Tiré par                    | Raison                                                    | À revoir             |
| --------------------- | -------------- | --------------------------- | --------------------------------------------------------- | -------------------- |
| `GHSA-86w9-cpqp-85rv` | `node-forge`   | `expo` › `@expo/cli`        | Aucun correctif publié ; signature de certificats en dev  | Montée du SDK Expo   |
| `GHSA-5p2g-fcmc-qvqq` | `image-size`   | `expo` › `metro`            | Correctif en version majeure 2, incompatible avec Metro   | Montée du SDK Expo   |
| `GHSA-w3rx-r6r6-pgpr` | `image-size`   | `expo` › `metro`            | Idem                                                      | Montée du SDK Expo   |
| `GHSA-ggr8-5vv4-36mx` | `deepmerge-ts` | `prisma` › `@prisma/config` | Correctif en version majeure 8 ; lecture de config du CLI | Montée vers Prisma 7 |

Toute nouvelle exception doit être ajoutée à ce tableau dans la même PR.
