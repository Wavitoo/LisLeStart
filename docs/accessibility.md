# Accessibilité

Cible : WCAG 2.2 niveau AA (RGAA en France), sur le web et le mobile.

## Règles de conception

- Tout est utilisable au clavier, y compris la saisie d'un arbre complet de pronostics ; focus toujours visible.
- Chaque arbre a une vue liste équivalente (matchs par tour).
- HTML sémantique, titres hiérarchisés, libellés sur tous les champs.
- Mises à jour en direct annoncées avec `aria-live="polite"`, regroupées pour ne pas submerger.
- Contraste 4,5:1 pour le texte ; une information n'est jamais portée par la seule couleur.
- Erreurs de formulaire explicites, liées au champ, avec une suggestion de correction.
- Zoom à 200 % sans perte, respect de `prefers-reduced-motion`.
- Mobile : TalkBack, tailles de texte dynamiques, zones tactiles de 48 dp.

## Tests automatiques (CI)

Le job `a11y` de `ci.yml` lance toute la suite Playwright (`test:e2e`, Next avec l'API simulée). `apps/web/e2e/a11y.spec.ts` y fait analyser chaque page par axe-core (règles WCAG 2.0/2.1/2.2 A et AA) : **la CI échoue sur toute violation d'impact `serious` ou `critical`** ; les autres specs vérifient aussi axe sur leurs parcours. Le rapport Playwright est publié en artefact en cas d'échec.

En local :

```bash
pnpm --filter @lislestart/web exec playwright install chromium   # une fois
pnpm --filter @lislestart/web test:e2e
```

Les pages sont découvertes automatiquement depuis `apps/web/app/**/page.tsx`. Une route dynamique (`[id]`) demande une URL d'exemple dans `dynamicExamples`, sinon le test échoue.

## Modèles appliqués sur le web

Premier écran : création de tournoi (`/admin/tournois/nouveau`).

- **Erreurs** : message sous le champ (`⚠` + texte, jamais la seule couleur), lié par `aria-describedby`, champ en `aria-invalid="true"`. Chaque message dit ce qui ne va pas puis comment corriger. À l'envoi refusé, un récapitulatif en haut du formulaire reçoit le focus et liste un lien par erreur vers le champ concerné.
- **Listes réordonnables** : poignée de glisser-déposer pour la souris et le tactile, boutons « Monter / Descendre » pour le clavier. Le focus suit l'élément déplacé et la nouvelle position est annoncée dans une région `aria-live="polite"` (« Étape 2 déplacée en position 1 »).
- **Contrôles** : Radix UI (liste déroulante, boutons radio, cases, boîte de dialogue), chacun avec un `<label>`. Fonctions pas encore livrées : boutons visibles en `aria-disabled` avec la mention « Bientôt ».
- **Bordure des champs** : jeton `line-control` (`#646c94`, ≥ 3:1 sur la surface et le fond) au lieu de `border/strong` de la maquette (1,7:1), pour WCAG 1.4.11.

Tests automatisés : `pnpm --filter @lislestart/web test` (schéma et composants, Vitest + Testing Library) et `pnpm --filter @lislestart/web test:e2e` (Playwright + axe-core, règles WCAG 2.2 A/AA, avec et sans erreurs affichées, zoom 200 %, mouvement réduit). Le second lance Next avec l'API simulée ; installer le navigateur une fois avec `pnpm --filter @lislestart/web exec playwright install chromium`.

## Audit (sprint 5)

| Outil ou méthode             | Web | Mobile | Résultat |
| ---------------------------- | --- | ------ | -------- |
| axe-core (Playwright, en CI) | ✓   |        | Bloquant |
| Lighthouse                   |     |        |          |
| Parcours clavier complet     |     |        |          |
| NVDA (Windows)               |     |        |          |
| TalkBack (Android)           |     |        |          |

## Déclaration d'accessibilité

Publiée sur la plateforme (`/accessibilite`) : niveau atteint, limites connues, actions prévues. Brouillon à rédiger au sprint 5.
