import type { TournamentListResponse } from "@lislestart/shared";

export interface Api {
  liveTournaments(): Promise<TournamentListResponse>;
}

/** Erreur affichable telle quelle à l'utilisateur. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const TIMEOUT_MS = 10_000;

/** Client de l'API Seedline ; `fetchImpl` est injecté pour les tests. */
export function createHttpApi(baseUrl: string, fetchImpl: typeof fetch = fetch): Api {
  async function get<T>(path: string): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetchImpl(new URL(path, baseUrl).toString(), {
        headers: { Accept: "application/json" },
        credentials: "include",
        signal: controller.signal,
      });
    } catch {
      throw new ApiError("Impossible de joindre le serveur. Vérifie ta connexion et réessaie.");
    } finally {
      clearTimeout(timer);
    }
    if (!response.ok) {
      throw new ApiError(
        `Le serveur a répondu avec une erreur (${response.status}). Réessaie dans un instant.`,
        response.status,
      );
    }
    return (await response.json()) as T;
  }

  return {
    liveTournaments: () => get<TournamentListResponse>("/tournaments?status=live"),
  };
}
