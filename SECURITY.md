# Politique de sécurité

## Signaler une vulnérabilité

N'ouvre pas d'issue publique. Utilise l'onglet **Security › Report a vulnerability** du dépôt (signalement privé GitHub), en décrivant le problème, les étapes pour le reproduire et l'impact supposé. Nous répondons sous 72 heures pendant la durée du projet.

## Mesures en place

| Risque                    | Mesure                                                                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Secrets dans le code      | `.env` ignoré, Gitleaks en pre-commit et en CI, secrets GitHub pour la CI                                                                                                 |
| Dépendances vulnérables   | Dependabot, `pnpm audit` en CI, lockfile versionné                                                                                                                        |
| Failles dans le code      | CodeQL à chaque pull request                                                                                                                                              |
| Triche sur les pronostics | Verrouillage sur l'horloge du serveur, refus côté API après le début du match                                                                                             |
| Actions sensibles         | Journal d'audit (correction de score, litige, Pick'em) en ajout seul                                                                                                      |
| Top 10 OWASP              | Contrôle d'accès par rôle côté serveur, validation des entrées, mots de passe Argon2id, cookies `HttpOnly` `Secure` `SameSite`, limitation de débit, en-têtes de sécurité |

Le détail et les choix sont documentés dans [`docs/adr`](docs/adr) et [`docs/security.md`](docs/security.md).
