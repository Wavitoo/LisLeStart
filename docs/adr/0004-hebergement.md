# 0004 — Hébergement de la démo

- Statut : proposé
- Date : 2026-10-25

## Contexte

Le sujet demande un déploiement automatique à chaque merge, sur une offre gratuite.

## Options envisagées

1. Render : web services Node et PostgreSQL gratuits, déploiement par hook. Mise en veille après inactivité.
2. Fly.io : proche du conteneur Docker, mais l'offre gratuite a évolué : à vérifier.
3. Vercel (web) + Render ou Railway (API) : excellent pour Next.js, mais deux plateformes.

## Décision

À valider au sprint 0 : Render pour l'API et le web, base PostgreSQL et Redis gérés (Render ou Upstash).

## Conséquences

- Les hooks de déploiement sont stockés dans les secrets GitHub (`RENDER_DEPLOY_HOOK_API`, `RENDER_DEPLOY_HOOK_WEB`).
- Prévoir un réveil de l'instance avant la soutenance, et une démo locale Docker en secours.
