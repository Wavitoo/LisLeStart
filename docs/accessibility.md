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

Le job `a11y` de `ci.yml` construit le web puis lance `apps/web/e2e/a11y.spec.ts` : axe-core (règles WCAG 2.0/2.1/2.2 A et AA) analyse chaque page principale et **la CI échoue sur toute violation d'impact `serious` ou `critical`**. Le rapport Playwright est publié en artefact en cas d'échec.

En local :

```bash
pnpm --filter @lislestart/web exec playwright install chromium   # une fois
pnpm --filter @lislestart/web build
pnpm --filter @lislestart/web test:a11y
```

Les pages sont découvertes automatiquement depuis `apps/web/app/**/page.tsx`. Une route dynamique (`[id]`) demande une URL d'exemple dans `dynamicExamples`, sinon le test échoue.

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
