import type { TournamentSummary } from "@lislestart/shared";
import { liveTournaments } from "../lib/tournaments";
import type { Api } from "./client";

const HOUR = 3_600_000;

/** Tournois fictifs placés autour de `now`, en attendant l'endpoint du backend. */
export function mockTournaments(now: Date): TournamentSummary[] {
  const at = (hours: number) => new Date(now.getTime() + hours * HOUR).toISOString();
  return [
    {
      id: "mock-coupe-hiver",
      name: "Coupe d'hiver",
      game: "Rocket League",
      source: "internal",
      location: "onsite",
      startsAt: at(-2),
      endsAt: at(4),
      participantCount: 16,
    },
    {
      id: "mock-ligue-babyfoot",
      name: "Ligue babyfoot du jeudi",
      game: "Babyfoot",
      source: "internal",
      location: "onsite",
      startsAt: at(-1),
      endsAt: at(3),
      participantCount: 12,
    },
    {
      id: "mock-open-echecs",
      name: "Open d'échecs en ligne",
      game: "Échecs",
      source: "file_import",
      location: "online",
      startsAt: at(-5),
      endsAt: at(1),
      participantCount: 32,
    },
    {
      id: "mock-demain",
      name: "Qualifications de printemps",
      game: "Street Fighter 6",
      source: "internal",
      location: "mixed",
      startsAt: at(20),
      endsAt: at(28),
      participantCount: 64,
    },
  ];
}

/** Même contrat que l'API : le filtre « en cours » est fait côté serveur. */
export function createMockApi(clock: () => Date = () => new Date()): Api {
  return {
    async liveTournaments() {
      const now = clock();
      return {
        serverTime: now.toISOString(),
        tournaments: liveTournaments(mockTournaments(now), now),
      };
    },
  };
}
