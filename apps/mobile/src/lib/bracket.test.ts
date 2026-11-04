import type { BracketMatch, BracketSlot, BracketStage } from "@lislestart/shared";
import { describe, expect, it } from "vitest";
import { advanceBracket, mockBrackets } from "../api/mockBracket";
import {
  applyBracketUpdate,
  formatLabel,
  liveCount,
  matchAccessibilityLabel,
  slotLabel,
} from "./bracket";

const slot = (overrides: Partial<BracketSlot> = {}): BracketSlot => ({
  participantId: "a",
  name: "Les Hiboux",
  seed: 1,
  score: null,
  isBye: false,
  ...overrides,
});

const match = (overrides: Partial<BracketMatch> = {}): BracketMatch => ({
  id: "m1",
  number: 1,
  bestOf: 3,
  status: "scheduled",
  scheduledAt: null,
  slots: [slot(), slot({ participantId: "b", name: "Kraken Club", seed: 4 })],
  winnerId: null,
  ...overrides,
});

const stage = (matches: BracketMatch[]): BracketStage[] => [
  {
    id: "s",
    name: "Phase finale",
    format: "single_elimination",
    rounds: [{ round: 1, label: "Demi-finales", matches }],
  },
];

describe("libellés de l'arbre", () => {
  it("écrit exempt et à déterminer en toutes lettres", () => {
    expect(slotLabel(slot({ isBye: true, participantId: null, name: null }))).toBe("Exempt");
    expect(slotLabel(slot({ participantId: null, name: null }))).toBe("À déterminer");
    expect(formatLabel("swiss")).toBe("Ronde suisse");
  });

  it("décrit un match terminé en une phrase avec score et vainqueur", () => {
    const done = match({
      status: "done",
      winnerId: "a",
      slots: [slot({ score: 2 }), slot({ participantId: "b", name: "Kraken Club", score: 1 })],
    });
    expect(matchAccessibilityLabel(done, "Demi-finales")).toBe(
      "Demi-finales, match 1. Les Hiboux contre Kraken Club. Score 2 – 1. Terminé. Vainqueur : Les Hiboux",
    );
  });

  it("annonce qui passe au tour suivant face à un exempt", () => {
    const byeMatch = match({
      status: "done",
      slots: [slot(), slot({ participantId: null, name: null, isBye: true })],
    });
    expect(matchAccessibilityLabel(byeMatch, "Tour 1")).toBe(
      "Tour 1, match 1. Les Hiboux contre Exempt. Les Hiboux passe au tour suivant",
    );
  });

  it("ne donne pas de score avant le début", () => {
    expect(matchAccessibilityLabel(match(), "Finale")).not.toContain("Score");
  });
});

describe("arbre en direct", () => {
  const event = {
    tournamentId: "t",
    matchId: "m1",
    status: "live" as const,
    slots: [
      { participantId: "b", score: 1 },
      { participantId: "a", score: 0 },
    ],
    winnerId: null,
    updatedAt: "2026-11-14T15:00:00.000Z",
  };

  it("applique le score au bon match, dans le bon emplacement", () => {
    const [updated] = applyBracketUpdate(stage([match(), match({ id: "m2" })]), event);
    const [m1, m2] = updated?.rounds[0]?.matches ?? [];
    expect(m1?.status).toBe("live");
    expect(m1?.slots.map((s) => s.score)).toEqual([0, 1]);
    expect(m2?.status).toBe("scheduled");
  });

  it("compte les matchs en direct", () => {
    expect(liveCount(stage([match({ status: "live" }), match({ id: "m2" })]))).toBe(1);
  });

  it("qualifie le vainqueur d'une demie pour la finale (faux serveur)", () => {
    const coupe = mockBrackets()["mock-coupe-hiver"] ?? [];
    const advanced = advanceBracket(coupe, {
      tournamentId: "mock-coupe-hiver",
      matchId: "mock-demi-1",
      status: "done",
      slots: [
        { participantId: "hiboux", score: 2 },
        { participantId: "kraken", score: 1 },
      ],
      winnerId: "hiboux",
      updatedAt: "2026-11-14T15:00:00.000Z",
    });
    const rounds = advanced[0]?.rounds ?? [];
    expect(rounds[1]?.matches[0]?.winnerId).toBe("hiboux");
    const finale = rounds[2]?.matches[0];
    expect(finale?.slots.map(slotLabel)).toEqual(["Les Hiboux", "À déterminer"]);
    expect(finale?.slots[0]?.score).toBeNull();
  });

  it("données de démo cohérentes : un seul quart en manche décisive, un exempt au babyfoot", () => {
    const brackets = mockBrackets();
    const quarts = brackets["mock-coupe-hiver"]?.[0]?.rounds[0]?.matches ?? [];
    expect(quarts.filter((m) => m.slots.every((s) => s.score === 1 || s.score === 2))).toHaveLength(
      1,
    );
    const tour1 = brackets["mock-ligue-babyfoot"]?.[0]?.rounds[0]?.matches ?? [];
    const byeMatch = tour1.find((m) => m.slots.some((s) => s.isBye));
    expect(byeMatch?.winnerId).toBe("gamelle");
  });
});
