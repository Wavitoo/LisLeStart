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

/** Un emplacement de match vu par le pronostiqueur ; `name` est null tant qu'il est à déterminer. */
export interface PredictionSlot {
  participantId: string | null;
  name: string | null;
  /** Manches gagnées ; null tant que le match n'a pas commencé. */
  score: number | null;
}

/** Pronostic d'un utilisateur sur un match en duel. */
export interface PredictionInput {
  winnerId: string;
  /** Score exact facultatif, dans l'ordre des emplacements ; null en BO1 ou sans score. */
  score: [number, number] | null;
}

/** Part du public pour un participant, en pourcentage entier. */
export interface DistributionShare {
  participantId: string;
  percent: number;
}

/** Match ouvert ou fermé aux pronostics (contrat API, voir docs/mobile.md). */
export interface PredictionMatch {
  id: string;
  tournamentId: string;
  tournamentName: string;
  /** Nom du tour, par exemple « Demi 1 ». */
  roundLabel: string;
  bestOf: number;
  status: MatchStatus;
  /** Verrouillage du pronostic (ISO 8601, horloge du serveur) ; null si pas encore planifié. */
  locksAt: string | null;
  slots: PredictionSlot[];
  myPrediction: PredictionInput | null;
  /** Répartition du public : visible seulement après verrouillage, null avant. */
  distribution: DistributionShare[] | null;
  predictionCount: number;
}

/** Réponse de `GET /predictions/feed` : matchs en cours et à venir des tournois suivis. */
export interface PredictionFeedResponse {
  serverTime: string;
  matches: PredictionMatch[];
}

/** Cycle de vie d'une question Pick'em. */
export type PickemStatus = "open" | "locked" | "resolved" | "cancelled";

export interface PickemOption {
  id: string;
  label: string;
}

/** Question Pick'em vue par l'utilisateur (contrat API, voir docs/mobile.md). */
export interface PickemQuestionView {
  id: string;
  tournamentId: string;
  tournamentName: string;
  template: PickemTemplate;
  title: string;
  status: PickemStatus;
  /** Clôture des réponses (ISO 8601, horloge du serveur). */
  closesAt: string;
  /** Points gagnés avec la bonne réponse. */
  points: number;
  options: PickemOption[];
  /** Option choisie par l'utilisateur, null sans réponse ou sans session. */
  myAnswer: string | null;
  /** Bonne réponse, connue une fois la question résolue. */
  correctOptionId: string | null;
  /** Raison de l'annulation (donnée manquante), affichée aux participants. */
  cancelReason: string | null;
  /** Répartition des réponses : visible seulement après la clôture, null avant. */
  distribution: { optionId: string; percent: number }[] | null;
  answerCount: number;
}

/** Réponse de `GET /pickem/feed`. */
export interface PickemFeedResponse {
  serverTime: string;
  questions: PickemQuestionView[];
}

/** Portée d'un classement de pronostiqueurs. */
export type LeaderboardScope = "global" | "tournament" | "group";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  points: number;
}

/** Réponse de `GET /leaderboards` : le haut du classement et la ligne de l'utilisateur. */
export interface LeaderboardResponse {
  scope: LeaderboardScope;
  title: string;
  entries: LeaderboardEntry[];
  /** Ligne de l'utilisateur connecté, même hors du haut du classement ; null sans session. */
  me: LeaderboardEntry | null;
  participantCount: number;
}

/** Groupe d'amis de l'utilisateur (`GET /me/groups`). */
export interface FriendGroup {
  id: string;
  name: string;
  memberCount: number;
  /** Code à partager pour inviter des amis. */
  inviteCode: string;
}

/** Badge gagné par l'utilisateur (`GET /me/badges`). */
export interface Badge {
  id: string;
  name: string;
  description: string;
  earnedAt: string;
}

export interface Participant {
  id: string;
  name: string;
  /** Tête de série : 1 = la meilleure. */
  seed: number;
}
