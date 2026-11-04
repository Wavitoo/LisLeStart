import type {
  AuthUser,
  MatchUpdatedEvent,
  PredictionInput,
  PredictionMatch,
  TournamentSummary,
} from "@lislestart/shared";
import { applyMatchUpdate, isLocked } from "../lib/predictions";
import { liveTournaments } from "../lib/tournaments";
import { ApiError, type Api, type FieldError, type Registration } from "./client";

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

const MINUTE = 60_000;

/** Matchs fictifs placés autour de `origin` : un en direct, deux à pronostiquer, une finale à venir. */
export function mockPredictionMatches(origin: Date): PredictionMatch[] {
  const at = (minutes: number) => new Date(origin.getTime() + minutes * MINUTE).toISOString();
  const slot = (participantId: string, name: string, score: number | null = null) => ({
    participantId,
    name,
    score,
  });
  return [
    {
      id: "mock-demi-1",
      tournamentId: "mock-coupe-hiver",
      tournamentName: "Coupe d'hiver",
      roundLabel: "Demi 1",
      bestOf: 3,
      status: "live",
      locksAt: at(-25),
      slots: [slot("hiboux", "Les Hiboux", 1), slot("kraken", "Kraken Club", 1)],
      myPrediction: null,
      distribution: [
        { participantId: "hiboux", percent: 72 },
        { participantId: "kraken", percent: 28 },
      ],
      predictionCount: 1384,
    },
    {
      id: "mock-demi-2",
      tournamentId: "mock-coupe-hiver",
      tournamentName: "Coupe d'hiver",
      roundLabel: "Demi 2",
      bestOf: 3,
      status: "scheduled",
      locksAt: at(2),
      slots: [slot("renards", "Les Renards"), slot("nova", "Team Nova")],
      myPrediction: null,
      distribution: null,
      predictionCount: 912,
    },
    {
      id: "mock-babyfoot-t2",
      tournamentId: "mock-ligue-babyfoot",
      tournamentName: "Ligue babyfoot du jeudi",
      roundLabel: "Tour 2",
      bestOf: 1,
      status: "scheduled",
      locksAt: at(40),
      slots: [slot("pieds-carres", "Les Pieds Carrés"), slot("gamelle", "Gamelle FC")],
      myPrediction: null,
      distribution: null,
      predictionCount: 156,
    },
    {
      id: "mock-finale",
      tournamentId: "mock-coupe-hiver",
      tournamentName: "Coupe d'hiver",
      roundLabel: "Finale",
      bestOf: 5,
      status: "scheduled",
      locksAt: at(90),
      slots: [
        { participantId: null, name: null, score: null },
        { participantId: null, name: null, score: null },
      ],
      myPrediction: null,
      distribution: null,
      predictionCount: 0,
    },
  ];
}

/** Compte fictif prêt à l'emploi en démo (aucune donnée réelle). */
export const DEMO_ACCOUNT = {
  email: "demo@seedline.test",
  password: "phrase de passe demo",
  displayName: "zero_tilt",
} as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mêmes règles et mêmes messages que l'API (apps/api/src/auth/auth.dto.ts). */
function validateRegistration({ email, displayName, password }: Registration): FieldError[] {
  const errors: FieldError[] = [];
  if (!EMAIL.test(email.trim())) {
    errors.push({
      field: "email",
      message: "Saisis une adresse email valide, par exemple nom@exemple.fr.",
    });
  }
  const name = displayName.trim();
  if (name.length < 2 || name.length > 32) {
    errors.push({
      field: "displayName",
      message: "Le pseudo doit faire entre 2 et 32 caractères.",
    });
  }
  if (password.length < 10 || password.length > 128) {
    errors.push({
      field: "password",
      message:
        "Le mot de passe doit faire entre 10 et 128 caractères. Une phrase de passe marche bien.",
    });
  }
  return errors;
}

/**
 * Même contrat que l'API : filtre « en cours », verrouillage et session faits côté « serveur ».
 * Les matchs sont placés une fois pour toutes à la création, pour que les comptes à rebours
 * avancent ; chaque compte a ses propres pronostics.
 */
/** Faux serveur : l'API, plus de quoi y reporter les résultats du direct simulé. */
export interface MockApi extends Api {
  applyMatchUpdate(event: MatchUpdatedEvent): void;
  /** Heure de verrouillage d'un match de démo, pour caler le direct simulé dessus. */
  locksAt(matchId: string): Date | null;
}

export function createMockApi(clock: () => Date = () => new Date()): MockApi {
  let matches = mockPredictionMatches(clock());
  const accounts = new Map<string, { user: AuthUser; password: string }>();
  /** Pronostics par compte, puis par match. */
  const predictions = new Map<string, Map<string, PredictionInput>>();
  let current: AuthUser | null = null;

  const demo: AuthUser = {
    id: "mock-user-demo",
    email: DEMO_ACCOUNT.email,
    displayName: DEMO_ACCOUNT.displayName,
    role: "spectator",
  };
  accounts.set(demo.email, { user: demo, password: DEMO_ACCOUNT.password });
  predictions.set(demo.id, new Map([["mock-demi-1", { winnerId: "hiboux", score: [2, 1] }]]));

  return {
    async liveTournaments() {
      const now = clock();
      return {
        serverTime: now.toISOString(),
        tournaments: liveTournaments(mockTournaments(now), now),
      };
    },

    async predictionFeed() {
      const mine = current ? predictions.get(current.id) : undefined;
      // Copie : l'écran ne doit pas modifier l'état du « serveur »
      const copy = JSON.parse(JSON.stringify(matches)) as PredictionMatch[];
      for (const match of copy) match.myPrediction = mine?.get(match.id) ?? null;
      return { serverTime: clock().toISOString(), matches: copy };
    },

    async savePrediction(matchId, prediction) {
      if (!current) throw new ApiError("Connecte-toi pour pronostiquer.", 401);
      const match = matches.find((m) => m.id === matchId);
      if (!match) throw new ApiError("Match introuvable.", 404);
      if (isLocked(match, clock())) throw new ApiError("Prono fermé : le match a commencé.", 409);
      if (!match.slots.some((s) => s.participantId === prediction.winnerId)) {
        throw new ApiError("Ce participant ne joue pas ce match.", 400);
      }
      const mine = predictions.get(current.id) ?? new Map<string, PredictionInput>();
      mine.set(matchId, prediction);
      predictions.set(current.id, mine);
      return prediction;
    },

    async me() {
      return current;
    },

    async login({ email, password }) {
      const account = accounts.get(email.trim().toLowerCase());
      if (!account || account.password !== password) {
        throw new ApiError("Email ou mot de passe incorrect.", 401);
      }
      current = account.user;
      return current;
    },

    async register(registration) {
      const errors = validateRegistration(registration);
      if (errors.length > 0) throw new ApiError("Certains champs sont invalides.", 400, errors);
      const email = registration.email.trim().toLowerCase();
      if (accounts.has(email)) {
        throw new ApiError("Un compte existe déjà avec cet email. Connecte-toi plutôt.", 409);
      }
      const user: AuthUser = {
        id: `mock-user-${accounts.size + 1}`,
        email,
        displayName: registration.displayName.trim(),
        role: registration.role,
      };
      accounts.set(email, { user, password: registration.password });
      current = user;
      return user;
    },

    async logout() {
      current = null;
    },

    applyMatchUpdate(event) {
      matches = applyMatchUpdate(matches, event);
    },

    locksAt(matchId) {
      const locksAt = matches.find((m) => m.id === matchId)?.locksAt;
      return locksAt ? new Date(locksAt) : null;
    },
  };
}
