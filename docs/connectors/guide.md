# Écrire un connecteur

Un connecteur branche une source externe de tournois sans toucher au cœur du produit. start.gg est le seul livré ; ce guide permet d'en écrire un autre.

## Interface (prévisionnelle, à figer au sprint 3)

```ts
export interface TournamentConnector {
  /** Identifiant court : "startgg". */
  readonly id: string;
  /** Retrouve un tournoi à partir d'une URL ou d'une recherche. */
  find(query: string): Promise<ExternalTournamentRef[]>;
  /** Récupère phases, participants, matchs, manches et classements disponibles. */
  fetch(ref: ExternalTournamentRef): Promise<ExternalTournament>;
  /** Données que la source fournit (pour ne proposer que les Pick'em résolubles). */
  capabilities(): ConnectorCapabilities;
}
```

## À documenter

1. Correspondance des données avec le modèle de la plateforme
2. Synchronisation régulière, cache, reprise automatique
3. Limites de requêtes et backoff
4. Tests avec des réponses enregistrées (mocks)
5. Tutoriel complet : un connecteur minimal lisant un fichier JSON distant
