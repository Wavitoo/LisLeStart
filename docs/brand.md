# Identité du produit : Seedline

La charte complète est dans [brand/seedline-charte-graphique.pdf](brand/seedline-charte-graphique.pdf). Cette page en reprend l'essentiel pour le code.

## Nom

**Seedline**, signature « // tournois · pronostics · en direct ». Nom original, sans reprise de start.gg, de Riot Games ni d'Epitech. Le dépôt et les packages (`@lislestart/*`) gardent leur nom technique.

## Logos

Fichiers dans [brand/logos/](brand/logos/) : SVG source et PNG en 48, 192, 512 et 1024 px.

| Fichier                 | Usage                                    | Taille minimale |
| ----------------------- | ---------------------------------------- | --------------- |
| `seedline-logo.*`       | Logo complet : site, soutenance, réseaux | 160 px          |
| `seedline-icon.*`       | Icône d'app, favicon, avatars            | 48 px           |
| `seedline-horizontal.*` | En-têtes web, dashboard LAN, bandeaux    | —               |

- Toujours sur fond Nuit, jamais déformé, recoloré ni pivoté ; pas de photo ou de vidéo derrière.
- En React Native, utiliser les **PNG** : le halo des SVG est un filtre que certains moteurs ignorent.
- Mobile : `apps/mobile/assets/icon.png` (icône) et `adaptive-icon.png` (même icône réduite à 62 % pour la zone sûre des icônes adaptatives Android).

## Couleurs

Un seul thème, sombre. Trois couleurs vives à rôle fixe :

| Nom    | Hex       | Rôle                                                              |
| ------ | --------- | ----------------------------------------------------------------- |
| lime   | `#C6F432` | Action : bouton principal, onglet actif, choix sélectionné, focus |
| violet | `#8B7BFF` | Pronostic : part du public, statistiques Pick'em, verrouillage    |
| corail | `#FF8A65` | Alerte : prono faux, erreur de saisie, question annulée           |

| Nom            | Hex       | Usage            |
| -------------- | --------- | ---------------- |
| nuit           | `#0F1222` | Fond de page     |
| tabbar         | `#12162A` | Navigation fixe  |
| surface        | `#181C30` | Cartes, panneaux |
| surface-raised | `#1F2440` | Champs, options  |
| line           | `#292F4D` | Bordures         |
| craie          | `#F2F4FA` | Texte principal  |
| muted          | `#9BA0B3` | Texte secondaire |
| lime-soft      | `#2C3625` | Fond validé      |
| violet-soft    | `#25254A` | Fond verrouillé  |
| corail-soft    | `#3A282E` | Fond erreur      |

Tous les couples texte/fond de la charte dépassent 4,5:1 (craie sur nuit 16,9:1, muted sur surface 6,5:1, nuit sur lime 14,5:1…). Les fonds `*-soft` portent du texte craie et une icône dans la couleur vive associée.

## Typographie

| Police                                  | Usage                           | Graisses      |
| --------------------------------------- | ------------------------------- | ------------- |
| Barlow Condensed, toujours en capitales | Titres                          | 600, 700, 800 |
| Manrope                                 | Texte                           | 400, 600, 700 |
| JetBrains Mono                          | Scores, points, rangs, horaires | 400, 600      |

Échelle : title 32/36, heading 20/24, section 15/20, body 15/22, label 13/18, caption 12/16, score 36/40, data 15/20. Milliers avec une espace (1 240), scores avec un tiret demi-cadratin (3 – 1).

## Formes

Espacement au pas de 4 px (4, 8, 12, 16, 24, 32, 48) ; cartes à 16 px de marge sur mobile, 24 px sur web. Rayons 6, 10, 16 et 999 px. Pas d'ombre portée ni de dégradé : les cartes se détachent par la couleur et un filet.

## Règles

- Un état n'est jamais porté par la couleur seule : icône et mot l'accompagnent.
- Focus clavier : anneau lime de 3 px décalé de 2 px ; cibles tactiles de 48 dp ; animations coupées avec `prefers-reduced-motion`.
- Un seul bouton lime par écran ou par carte.
- On tutoie, sans point d'exclamation ni emoji. Un bouton désactivé dit pourquoi (« Prono fermé »).
- Pas d'argent : points, badges et titres uniquement (jamais « miser », « pari », « gains », « cote », €).

Implémentation mobile : [apps/mobile/src/theme.ts](../apps/mobile/src/theme.ts).
