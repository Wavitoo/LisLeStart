# 0002 — API NestJS, Fastify et Prisma

- Statut : accepté
- Date : 2026-10-25

## Contexte

L'API gère des rôles, du temps réel, des jobs différés et doit exposer une documentation OpenAPI. Le modèle est très relationnel (tournoi, étape, match, manche, pronostic).

## Options envisagées

1. Express ou Fastify « nu » : léger, mais tout à structurer soi-même.
2. NestJS : modules, guards pour les permissions, intégration Swagger, WebSocket et files de jobs.
3. ORM : Prisma (schéma lisible, migrations) ou TypeORM (décorateurs, plus verbeux).

## Décision

NestJS avec l'adaptateur Fastify, Prisma sur PostgreSQL, Socket.IO pour le temps réel, BullMQ sur Redis pour les jobs.

## Conséquences

- Les permissions sont vérifiées côté serveur par des guards par rôle.
- Le schéma Prisma sert de référence pour le modèle de données.
- Redis est requis en local (fourni par Docker Compose).
