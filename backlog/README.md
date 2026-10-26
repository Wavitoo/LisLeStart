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

2. **Équipe** : déjà renseignée dans [team.json](team.json) (prénom → identifiant GitHub) et dans `.github/CODEOWNERS`. Chaque issue de [issues.json](issues.json) liste ses responsables dans `owners`.

3. **Créer le backlog et le Project** :

   ```bash
   gh auth refresh -s project                              # une fois, pour les Projects
   node scripts/create-github-backlog.mjs --dry-run         # vérifier
   node scripts/create-github-backlog.mjs --project         # créer
   ```

4. **Protéger `dev`, `main` et `prod`** : voir [docs/operations.md](../docs/operations.md).

5. **Inviter les deux autres membres** (Settings › Collaborators), qui lancent `./scripts/setup.sh`.

## Répartition

| Pôle       | Label             | Responsable | Issues |
| ---------- | ----------------- | ----------- | ------ |
| Backend    | `pole:backend`    | Martin      | 44     |
| Front web  | `pole:web`        | Enzo        | 11     |
| Mobile     | `pole:mobile`     | Arslan      | 6      |
| Transverse | `pole:transverse` | Arslan      | 12     |

Quelques issues ont plusieurs responsables (`owners`) : authentification et rôles (Arslan + Martin), simulateur (Martin + Arslan), audit d'accessibilité (Enzo + Arslan), documentation technique (Martin + Arslan), soutenance (les 3).

**Déséquilibre à traiter** : Martin porte 47 issues, Arslan 21, Enzo 12. Les issues web et mobile sont plus longues (écrans, accessibilité), mais l'écart reste important : à rééquilibrer en planification de sprint (voir AGENTS.md, section 3).

## Rituel de sprint (toutes les 2 semaines)

- **Lundi** : planification, chacun prend ses issues du sprint dans le Project.
- **Chaque jour** : 10 minutes de point (fait, à faire, bloquant), à distance.
- **Dernier jour** : démo interne de 10 minutes par pôle, tag de version, mise à jour du CHANGELOG, test du nouvel arrivant.
