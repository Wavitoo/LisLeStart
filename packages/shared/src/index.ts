/** Rôles de la plateforme (voir docs/architecture.md). */
export type Role = "admin" | "player" | "spectator";

/** Utilisateur connecté, tel que renvoyé par `GET /auth/me`. */
export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
}

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

/** État d'un match. */
export type MatchStatus = "scheduled" | "called" | "live" | "disputed" | "done" | "forfeit";

/** Un emplacement de match : 2 en duel, N en FFA. */
export interface MatchSlotState {
  participantId: string | null;
  /** Manches gagnées (duel) ou points (FFA) ; null tant que rien n'est joué. */
  score: number | null;
}

/** Diffusé à chaque changement d'un match : résultat, correction, litige, synchro start.gg. */
export interface MatchUpdatedEvent {
  tournamentId: string;
  matchId: string;
  status: MatchStatus;
  slots: MatchSlotState[];
  winnerId: string | null;
  /** Date ISO 8601 du changement (horloge du serveur). */
  updatedAt: string;
}

/**
 * Diffusé quand un classement change (tournoi, pronostiqueurs). Volontairement léger : le client
 * recharge le classement par HTTP, ce qui évite d'envoyer un gros tableau à des milliers de sockets.
 */
export interface StandingsUpdatedEvent {
  tournamentId: string;
  updatedAt: string;
}

/** Ce qu'un client peut suivre : un tournoi entier ou un seul match. */
export interface RealtimeSubscription {
  type: "tournament" | "match";
  id: string;
}

/** Réponse du serveur à `subscribe` et `unsubscribe`. */
export type RealtimeAck = { ok: true } | { ok: false; error: string };

/** Événements envoyés par le serveur (Socket.IO). */
export interface ServerToClientEvents {
  "match:updated": (event: MatchUpdatedEvent) => void;
  "standings:updated": (event: StandingsUpdatedEvent) => void;
}

/** Événements envoyés par le client (Socket.IO). */
export interface ClientToServerEvents {
  subscribe: (subscription: RealtimeSubscription, ack: (result: RealtimeAck) => void) => void;
  unsubscribe: (subscription: RealtimeSubscription, ack: (result: RealtimeAck) => void) => void;
}

export interface Participant {
  id: string;
  name: string;
  /** Tête de série : 1 = la meilleure. */
  seed: number;
}
