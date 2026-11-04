import type { TournamentSummary } from "@lislestart/shared";
import { describe, expect, it } from "vitest";
import {
  isLive,
  liveTournaments,
  participantsLabel,
  tournamentAccessibilityLabel,
} from "./tournaments";

const now = new Date("2026-11-14T15:00:00Z");

function tournament(id: string, startsAt: string, endsAt: string): TournamentSummary {
  return {
    id,
    name: `Tournoi ${id}`,
    game: "Babyfoot",
    source: "internal",
    location: "onsite",
    startsAt,
    endsAt,
    participantCount: 8,
  };
}

const past = tournament("passe", "2026-11-13T10:00:00Z", "2026-11-13T18:00:00Z");
const early = tournament("matin", "2026-11-14T09:00:00Z", "2026-11-14T20:00:00Z");
const late = tournament("aprem", "2026-11-14T14:00:00Z", "2026-11-14T20:00:00Z");
const future = tournament("demain", "2026-11-15T09:00:00Z", "2026-11-15T20:00:00Z");

describe("isLive", () => {
  it("est vrai entre le début et la fin", () => {
    expect(isLive(early, now)).toBe(true);
  });
  it("inclut l'instant du début et exclut celui de la fin", () => {
    expect(isLive(tournament("t", now.toISOString(), "2026-11-14T16:00:00Z"), now)).toBe(true);
    expect(isLive(tournament("t", "2026-11-14T10:00:00Z", now.toISOString()), now)).toBe(false);
  });
  it("est faux avant le début et après la fin", () => {
    expect(isLive(future, now)).toBe(false);
    expect(isLive(past, now)).toBe(false);
  });
});

describe("liveTournaments", () => {
  it("garde les tournois en cours, le plus récent en premier", () => {
    expect(liveTournaments([past, early, future, late], now).map((t) => t.id)).toEqual([
      "aprem",
      "matin",
    ]);
  });
  it("renvoie une liste vide sans tournoi en cours", () => {
    expect(liveTournaments([past, future], now)).toEqual([]);
  });
});

describe("libellés", () => {
  it("accorde le nombre de participants", () => {
    expect(participantsLabel(1)).toBe("1 participant");
    expect(participantsLabel(12)).toBe("12 participants");
  });
  it("annonce toutes les informations de la carte, en direct compris", () => {
    expect(tournamentAccessibilityLabel(early)).toBe(
      "Tournoi matin, Babyfoot, en direct, Sur place, 8 participants, Tournoi interne",
    );
  });
});
