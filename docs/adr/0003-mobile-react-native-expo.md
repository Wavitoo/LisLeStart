# 0003 — Mobile en React Native avec Expo, cible Android

- Statut : accepté (cible à confirmer au sprint 2)
- Date : 2026-10-25

## Contexte

Le sujet impose une application native ou multiplateforme sur une seule plateforme, sans site emballé (PWA, WebView). Le groupe n'a pas de Mac.

## Options envisagées

1. Natif Kotlin : performant, mais un langage de plus.
2. Flutter : bon outillage, mais Dart et aucun partage de code avec le web.
3. React Native avec Expo : TypeScript, partage des types et du client API, build Android sans compte payant.

iOS : la compilation est possible sans Mac (EAS Build), mais l'exécution demande un Mac (simulateur) ou un compte Apple Developer payant (appareil réel).

## Décision

React Native avec Expo SDK 54, cible officielle Android. iOS reste un bonus si un Mac ou un compte Apple devient disponible.

## Conséquences

- La CI produit un APK à chaque merge sur `main` (workflow « Mobile »).
- Le code reste sans spécificité Android, pour pouvoir sortir iOS sans réécriture.
- Accessibilité testée avec TalkBack.
