# Backlog et démarrage sur GitHub

Le backlog complet (73 issues, 7 sprints + bonus) est dans [issues.json](issues.json). Le script le crée sur GitHub en une commande.

## Mise en route (Sprint 0, jour 1)

1. **Créer le dépôt** (une seule personne) :

   ```bash
   cd lislestart
   git init -b main
   git add . && git commit -m "chore: squelette initial du projet"
   gh repo create lislestart --private --source=. --push
   ```

2. **Renseigner l'équipe** dans [team.json](team.json) (identifiants GitHub par pôle), et dans `.github/CODEOWNERS`. Remplacer `OWNER` dans le README par le propriétaire du dépôt.

3. **Créer le backlog et le Project** :

   ```bash
   gh auth refresh -s project                              # une fois, pour les Projects
   node scripts/create-github-backlog.mjs --dry-run         # vérifier
   node scripts/create-github-backlog.mjs --project         # créer
   ```

4. **Protéger `main`** : Settings › Branches (voir [docs/operations.md](../docs/operations.md)).

5. **Inviter les deux autres membres** (Settings › Collaborators), qui lancent `./scripts/setup.sh`.

## Répartition

| Pôle                   | Label             | Issues |
| ---------------------- | ----------------- | ------ |
| Plateforme et sécurité | `pole:plateforme` | 26     |
| Moteur et API          | `pole:moteur`     | 29     |
| Web et mobile          | `pole:front`      | 18     |

Le pôle web et mobile a moins d'issues, mais elles sont plus longues (écrans, accessibilité). À rééquilibrer en fin de sprint si besoin.

## Rituel de sprint (toutes les 2 semaines)

- **Lundi** : planification, chacun prend ses issues du sprint dans le Project.
- **Chaque jour** : 10 minutes de point (fait, à faire, bloquant), à distance.
- **Dernier jour** : démo interne de 10 minutes par pôle, tag de version, mise à jour du CHANGELOG, test du nouvel arrivant.
