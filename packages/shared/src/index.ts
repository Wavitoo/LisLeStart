/** Rôles de la plateforme (voir docs/architecture.md). */
export type Role = "admin" | "player" | "spectator";

/** Formats d'étape pris en charge par le moteur. */
export type StageFormat =
  "single_elimination" | "double_elimination" | "round_robin" | "swiss" | "free_for_all";

/** Origine d'un tournoi ou d'un résultat. */
export type Source = "internal" | "file_import" | "startgg";

/** Modèles de questions Pick'em. */
export type PickemTemplate = "most_picked" | "best_on_stat" | "total" | "ranking" | "yes_no";

/** Lieu d'un tournoi. */
export type LocationType = "online" | "onsite" | "mixed";

/** Tournoi tel que listé par `GET /tournaments` (contrat API, voir docs/mobile.md). */
export interface TournamentSummary {
  id: string;
  name: string;
  game: string;
  source: Source;
  location: LocationType;
  /** Dates ISO 8601. */
  startsAt: string;
  endsAt: string;
  /** Nombre d'équipes ou de joueurs inscrits. */
  participantCount: number;
}

/** Réponse de `GET /tournaments?status=live`, avec l'heure du serveur qui fait foi. */
export interface TournamentListResponse {
  serverTime: string;
  tournaments: TournamentSummary[];
}

export interface Participant {
  id: string;
  name: string;
  /** Tête de série : 1 = la meilleure. */
  seed: number;
}
