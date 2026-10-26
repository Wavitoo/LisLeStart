/** Rôles de la plateforme (voir docs/architecture.md). */
export type Role = "admin" | "player" | "spectator";

/** Formats d'étape pris en charge par le moteur. */
export type StageFormat =
  "single_elimination" | "double_elimination" | "round_robin" | "swiss" | "free_for_all";

/** Origine d'un tournoi ou d'un résultat. */
export type Source = "internal" | "file_import" | "startgg";

/** Modèles de questions Pick'em. */
export type PickemTemplate = "most_picked" | "best_on_stat" | "total" | "ranking" | "yes_no";

export interface Participant {
  id: string;
  name: string;
  /** Tête de série : 1 = la meilleure. */
  seed: number;
}
