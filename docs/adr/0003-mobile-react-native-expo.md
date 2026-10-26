# 0003 — Mobile en React Native avec Expo, Android uniquement

- Statut : accepté
- Date : 2026-10-26

## Contexte

Le sujet impose une application native ou multiplateforme sur une seule plateforme, sans site emballé (PWA, WebView). Le groupe n'a pas de Mac ni de compte Apple Developer.

## Options envisagées

1. Natif Kotlin : performant, mais un langage de plus.
2. Flutter : bon outillage, mais Dart et aucun partage de code avec le web.
3. React Native avec Expo : TypeScript, partage des types et du client API, build Android sans compte payant.

iOS : la compilation est possible sans Mac (EAS Build), mais l'exécution demande un Mac (simulateur) ou un compte Apple Developer payant (appareil réel).

## Décision

React Native avec Expo SDK 54, **Android uniquement**, décidé en équipe au sprint 0. iOS n'est pas visé, même en bonus : la configuration iOS est retirée du projet (`platforms: ["android"]` dans `app.json`).

## Conséquences

- La CI produit un APK installable à chaque merge sur `main` et `prod` (workflow « Mobile ») ; démo sur téléphone Android ou émulateur.
- Accessibilité testée avec TalkBack.
- Le code reste en React Native standard : si le besoin apparaissait, une cible iOS resterait possible sans réécriture, au prix d'un nouvel ADR.
