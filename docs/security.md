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
