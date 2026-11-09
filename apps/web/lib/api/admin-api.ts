import type { CreatedTournament, CreateTournamentInput, GameSummary } from "@lislestart/shared";

/** Résultat d'une création : le formulaire affiche `message` en haut de page en cas d'échec. */
export type CreateTournamentResult =
  { ok: true; tournament: CreatedTournament } | { ok: false; message: string };

/**
 * Appels du back-office. Deux implémentations derrière la même interface : HTTP vers l'API et
 * une version simulée tant que `POST /tournaments` et `GET /games` n'existent pas côté API.
 */
export interface AdminApi {
  /** null si la liste n'a pas pu être chargée. */
  listGames(): Promise<GameSummary[] | null>;
  createTournament(input: CreateTournamentInput): Promise<CreateTournamentResult>;
}

const NETWORK_ERROR =
  "Le serveur ne répond pas : vérifie ta connexion puis réessaie dans un instant.";

function errorMessage(status: number, body: unknown): string {
  if (status === 401) return "Ta session a expiré : reconnecte-toi puis publie à nouveau.";
  if (status === 403) {
    return "Seul un administrateur peut créer un tournoi : connecte-toi avec un compte administrateur.";
  }
  if (status === 429) return "Trop de requêtes : patiente une minute puis réessaie.";
  const message = (body as { message?: unknown } | null)?.message;
  if (status === 400 && message) {
    const detail = Array.isArray(message) ? message.join(" ") : String(message);
    return `Le serveur a refusé le tournoi : ${detail}`;
  }
  return "La publication a échoué côté serveur : réessaie dans un instant.";
}

/** Implémentation HTTP : la session de l'administrateur est relayée par le serveur Next. */
export function createHttpAdminApi(baseUrl: string, sessionCookie: string | null): AdminApi {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (sessionCookie) headers.cookie = sessionCookie;

  return {
    async listGames() {
      try {
        const response = await fetch(`${baseUrl}/games`, { headers, cache: "no-store" });
        return response.ok ? ((await response.json()) as GameSummary[]) : null;
      } catch {
        return null;
      }
    },

    async createTournament(input) {
      let response: Response;
      try {
        response = await fetch(`${baseUrl}/tournaments`, {
          method: "POST",
          headers,
          body: JSON.stringify(input),
          cache: "no-store",
        });
      } catch {
        return { ok: false, message: NETWORK_ERROR };
      }
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) return { ok: false, message: errorMessage(response.status, body) };
      return { ok: true, tournament: body as CreatedTournament };
    },
  };
}

/** Jeux fictifs de démonstration (aucune marque réelle). */
export const MOCK_GAMES: GameSummary[] = [
  { id: "game-fps", name: "FPS 5v5" },
  { id: "game-fighting", name: "Combat 1v1" },
  { id: "game-chess", name: "Échecs" },
  { id: "game-foosball", name: "Babyfoot" },
  { id: "game-racing", name: "Course de karts" },
];

/** Implémentation simulée : mêmes types, latence courte pour voir l'état de chargement. */
export function createMockAdminApi(delayMs = 600): AdminApi {
  let created = 0;
  const wait = () => new Promise((resolve) => setTimeout(resolve, delayMs));
  return {
    async listGames() {
      return MOCK_GAMES;
    },
    async createTournament(input) {
      await wait();
      created += 1;
      return { ok: true, tournament: { id: `mock-${created}`, name: input.name } };
    },
  };
}
