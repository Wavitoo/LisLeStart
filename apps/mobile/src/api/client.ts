import type {
  AuthUser,
  Badge,
  FriendGroup,
  LeaderboardResponse,
  LeaderboardScope,
  PickemFeedResponse,
  PredictionFeedResponse,
  PredictionInput,
  TournamentBracketResponse,
  TournamentListResponse,
} from "@lislestart/shared";

export interface Credentials {
  email: string;
  password: string;
}

export interface Registration extends Credentials {
  displayName: string;
  /** Seuls ces rôles s'obtiennent à l'inscription ; un admin est créé côté serveur. */
  role: "player" | "spectator";
}

export interface Api {
  liveTournaments(): Promise<TournamentListResponse>;
  /** Étapes d'un tournoi, tour par tour (vue liste de l'arbre). */
  tournamentBracket(tournamentId: string): Promise<TournamentBracketResponse>;
  predictionFeed(): Promise<PredictionFeedResponse>;
  /** Enregistre ou remplace le pronostic ; refusé par le serveur une fois le match commencé. */
  savePrediction(matchId: string, prediction: PredictionInput): Promise<PredictionInput>;
  /** Utilisateur de la session en cours, ou null sans session. */
  me(): Promise<AuthUser | null>;
  login(credentials: Credentials): Promise<AuthUser>;
  register(registration: Registration): Promise<AuthUser>;
  logout(): Promise<void>;
  pickemFeed(): Promise<PickemFeedResponse>;
  /** Enregistre ou remplace la réponse ; refusé par le serveur après la clôture. */
  answerPickem(questionId: string, optionId: string): Promise<{ optionId: string }>;
  /** Classement des pronostiqueurs ; `id` désigne le tournoi ou le groupe. */
  leaderboard(scope: LeaderboardScope, id?: string): Promise<LeaderboardResponse>;
  myGroups(): Promise<FriendGroup[]>;
  myBadges(): Promise<Badge[]>;
}

/** Erreur d'un champ de formulaire, renvoyée par l'API avec un 400. */
export interface FieldError {
  field: string;
  message: string;
}

/** Erreur affichable telle quelle à l'utilisateur. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly fieldErrors: FieldError[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const TIMEOUT_MS = 10_000;

/** Message par défaut quand le serveur n'en donne pas un en français. */
function fallbackMessage(status: number): string {
  if (status === 401) return "Connecte-toi pour continuer.";
  if (status === 409) return "Prono fermé : le match a commencé.";
  if (status === 429) return "Trop de tentatives. Attends une minute et réessaie.";
  return `Le serveur a répondu avec une erreur (${status}). Réessaie dans un instant.`;
}

/**
 * Erreur à partir de la réponse : pour les refus attendus (400, 401, 409), l'API renvoie un
 * message en français, plus précis que le nôtre ; les autres codes gardent le message générique.
 */
async function toApiError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => ({}))) as {
    message?: unknown;
    errors?: unknown;
  };
  const explained = [400, 401, 409].includes(response.status) && typeof body.message === "string";
  const message = explained ? (body.message as string) : fallbackMessage(response.status);
  const fieldErrors = Array.isArray(body.errors) ? (body.errors as FieldError[]) : [];
  return new ApiError(message, response.status, fieldErrors);
}

/** Client de l'API Seedline ; `fetchImpl` est injecté pour les tests. */
export function createHttpApi(baseUrl: string, fetchImpl: typeof fetch = fetch): Api {
  async function request<T>(
    path: string,
    init: { method?: string; body?: unknown } = {},
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let response: Response;
    try {
      // Le cookie de session est conservé par la pile réseau d'Android entre les requêtes
      response = await fetchImpl(new URL(path, baseUrl).toString(), {
        method: init.method ?? "GET",
        headers: {
          Accept: "application/json",
          ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        credentials: "include",
        signal: controller.signal,
      });
    } catch {
      throw new ApiError("Impossible de joindre le serveur. Vérifie ta connexion et réessaie.");
    } finally {
      clearTimeout(timer);
    }
    if (!response.ok) throw await toApiError(response);
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  return {
    liveTournaments: () => request<TournamentListResponse>("/tournaments?status=live"),
    tournamentBracket: (tournamentId) =>
      request<TournamentBracketResponse>(
        `/tournaments/${encodeURIComponent(tournamentId)}/bracket`,
      ),
    predictionFeed: () => request<PredictionFeedResponse>("/predictions/feed"),
    savePrediction: (matchId, prediction) =>
      request<PredictionInput>(`/matches/${encodeURIComponent(matchId)}/prediction`, {
        method: "PUT",
        body: prediction,
      }),
    async me() {
      try {
        return await request<AuthUser>("/auth/me");
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    login: (credentials) => request<AuthUser>("/auth/login", { method: "POST", body: credentials }),
    register: (registration) =>
      request<AuthUser>("/auth/register", { method: "POST", body: registration }),
    logout: () => request<void>("/auth/logout", { method: "POST" }),
    pickemFeed: () => request<PickemFeedResponse>("/pickem/feed"),
    answerPickem: (questionId, optionId) =>
      request<{ optionId: string }>(`/pickem/questions/${encodeURIComponent(questionId)}/answer`, {
        method: "PUT",
        body: { optionId },
      }),
    leaderboard: (scope, id) => {
      const query = new URLSearchParams({ scope, ...(id ? { id } : {}) });
      return request<LeaderboardResponse>(`/leaderboards?${query.toString()}`);
    },
    myGroups: () => request<FriendGroup[]>("/me/groups"),
    myBadges: () => request<Badge[]>("/me/badges"),
  };
}
