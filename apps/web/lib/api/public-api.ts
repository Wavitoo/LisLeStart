import type {
  BracketStage,
  ScheduledMatch,
  StageStandings,
  TournamentBracketResponse,
  TournamentDetail,
  TournamentListResponse,
  TournamentParticipantsResponse,
  TournamentSummary,
} from "@lislestart/shared";
import { mockTournamentData } from "./mock-tournaments";

/**
 * Lecture publique d'un tournoi (sans session). Deux implémentations derrière la même interface :
 * HTTP vers l'API (contrat dans docs/web.md) et une version simulée tant que ces routes n'existent
 * pas côté API. Chaque méthode lève une erreur si la donnée est indisponible : la page affiche
 * alors l'erreur dans la seule section concernée.
 */
export interface PublicApi {
  /** Tournois publics (`GET /tournaments`). */
  list(): Promise<TournamentSummary[]>;
  /** null : tournoi inexistant ou non public (404). */
  tournament(id: string): Promise<TournamentDetail | null>;
  bracket(id: string): Promise<BracketStage[]>;
  participants(id: string): Promise<TournamentParticipantsResponse>;
  schedule(id: string): Promise<ScheduledMatch[]>;
  standings(id: string): Promise<StageStandings[]>;
}

export class PublicApiError extends Error {
  constructor(readonly status: number | null) {
    super(status ? `L'API a répondu ${status}` : "L'API ne répond pas");
    this.name = "PublicApiError";
  }
}

export function createHttpPublicApi(baseUrl: string): PublicApi {
  async function get<T>(path: string): Promise<T> {
    let response: Response;
    try {
      // Données en direct : pas de cache entre deux visites
      response = await fetch(`${baseUrl}${path}`, { cache: "no-store" });
    } catch {
      throw new PublicApiError(null);
    }
    if (!response.ok) throw new PublicApiError(response.status);
    return (await response.json()) as T;
  }
  const encoded = (id: string) => encodeURIComponent(id);

  return {
    async list() {
      return (await get<TournamentListResponse>("/tournaments")).tournaments;
    },
    async tournament(id) {
      try {
        return await get<TournamentDetail>(`/tournaments/${encoded(id)}`);
      } catch (error) {
        if (error instanceof PublicApiError && error.status === 404) return null;
        throw error;
      }
    },
    async bracket(id) {
      return (await get<TournamentBracketResponse>(`/tournaments/${encoded(id)}/bracket`)).stages;
    },
    participants: (id) =>
      get<TournamentParticipantsResponse>(`/tournaments/${encoded(id)}/participants`),
    async schedule(id) {
      return (await get<{ matches: ScheduledMatch[] }>(`/tournaments/${encoded(id)}/schedule`))
        .matches;
    },
    async standings(id) {
      return (await get<{ stages: StageStandings[] }>(`/tournaments/${encoded(id)}/standings`))
        .stages;
    },
  };
}

/** Version simulée : mêmes types, données fictives (aucune personne ni marque réelle). */
export function createMockPublicApi(): PublicApi {
  const data = mockTournamentData();
  const find = (id: string) => {
    const tournament = data[id];
    if (!tournament) throw new PublicApiError(404);
    return tournament;
  };
  return {
    async list() {
      return Object.values(data).map(({ detail }) => detail);
    },
    async tournament(id) {
      return data[id]?.detail ?? null;
    },
    bracket: async (id) => find(id).bracket,
    participants: async (id) => find(id).participants,
    schedule: async (id) => find(id).schedule,
    standings: async (id) => find(id).standings,
  };
}
