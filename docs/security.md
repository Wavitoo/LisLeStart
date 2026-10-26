# Sécurité

Synthèse dans [SECURITY.md](../SECURITY.md). Ce document détaille les choix et sert de checklist pour la revue OWASP du sprint 5.

## Checklist Top 10 OWASP (2021)

| Risque                     | Mesure prévue                                                                           | Statut        |
| -------------------------- | --------------------------------------------------------------------------------------- | ------------- |
| A01 Contrôle d'accès       | Guards NestJS par rôle, vérification de propriété sur chaque ressource (pas d'IDOR)     | À faire       |
| A02 Cryptographie          | Argon2id pour les mots de passe, HTTPS en ligne, cookies `Secure`                       | À faire       |
| A03 Injection              | Prisma (requêtes paramétrées), validation des entrées, import CSV/JSON au schéma strict | À faire       |
| A04 Conception             | Verrouillage serveur des pronostics, journal d'audit                                    | À faire       |
| A05 Configuration          | En-têtes de sécurité, CORS restreint, pas de stack trace en production                  | Partiel (web) |
| A06 Composants vulnérables | Dependabot, `pnpm audit` en CI                                                          | Fait          |
| A07 Authentification       | Sessions `HttpOnly` `SameSite`, limitation de débit sur la connexion                    | À faire       |
| A08 Intégrité              | Lockfile, CI obligatoire avant merge, secrets dans GitHub                               | Fait          |
| A09 Journalisation         | Journal d'audit, logs sans données sensibles                                            | À faire       |
| A10 SSRF                   | Connecteurs limités à des URL autorisées (start.gg)                                     | À faire       |

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
