# 0004 — Hébergement de la démo

- Statut : accepté
- Date : 2026-10-26

## Contexte

Le sujet demande un déploiement automatique à chaque merge, sur une offre gratuite. Le flux de branches (`dev` → `main` → `prod`) impose deux environnements en ligne : staging (`main`) et production (`prod`). Le projet dure d'octobre à fin janvier.

## Options envisagées

1. Render : web services Docker gratuits, déploiement par hook. Mise en veille après inactivité. Sa base PostgreSQL gratuite est limitée et expire après quelques semaines : elle ne tient pas jusqu'à la soutenance.
2. Fly.io : proche du conteneur Docker, mais l'offre gratuite a évolué et demande une carte bancaire.
3. Vercel (web) + Render ou Railway (API) : excellent pour Next.js, mais deux plateformes à administrer.
4. Neon pour PostgreSQL : offre gratuite sans expiration, branches de base (une par environnement), région Frankfurt.

## Décision

- **Render** pour l'API et le web : 4 web services gratuits, en Docker, région Frankfurt (EU Central).
- **Neon** pour PostgreSQL : un projet `lislestart`, une branche de base par environnement, région AWS Frankfurt.
- **Redis** : pas encore utilisé par le code ; à choisir quand le temps réel arrivera (sprint 2), entre Render Key Value et Upstash, sur offre gratuite.

| Environnement | Branche Git | API                                         | Web                                         | Base Neon    |
| ------------- | ----------- | ------------------------------------------- | ------------------------------------------- | ------------ |
| staging       | `main`      | https://lislestart-api-staging.onrender.com | https://lislestart-web-staging.onrender.com | `staging`    |
| production    | `prod`      | https://lislestart-api.onrender.com         | https://lislestart-web.onrender.com         | `production` |

## Conséquences

- Auto-Deploy désactivé sur Render : seul le job `deploy` de la CI déclenche un déploiement, via les hooks stockés en secrets d'environnement GitHub (`RENDER_DEPLOY_HOOK_API`, `RENDER_DEPLOY_HOOK_WEB`). Un code qui n'a pas passé la CI n'est jamais déployé.
- Les migrations Prisma s'appliquent au démarrage du conteneur API (`prisma migrate deploy`), sur la connexion **directe** Neon (sans `-pooler`).
- Instances gratuites en veille après inactivité : premier appel lent (jusqu'à une minute). Réveiller staging et production avant la soutenance, et garder la démo locale Docker en secours.
- Postgres 18 partout (Neon et Docker Compose local) pour éviter les écarts de comportement des migrations.
- Configuration détaillée et procédure de création dans [operations.md](../operations.md).
