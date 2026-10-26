import type { Participant } from "@lislestart/shared";
import { describe, expect, it } from "vitest";
import { bracketSize, generateSingleElimination, seedOrder } from "./index.js";

const players = (n: number): Participant[] =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, name: `Joueur ${i + 1}`, seed: i + 1 }));

describe("seedOrder", () => {
  it("place les têtes de série 1 et 2 dans des moitiés opposées", () => {
    expect(seedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });

  it("refuse une taille qui n'est pas une puissance de 2", () => {
    expect(() => seedOrder(6)).toThrow(RangeError);
  });
});

describe("bracketSize", () => {
  it.each([
    [2, 2],
    [5, 8],
    [8, 8],
    [9, 16],
  ])("%i participants → arbre de %i", (n, size) => {
    expect(bracketSize(n)).toBe(size);
  });
});

describe("generateSingleElimination", () => {
  it("génère 4 matchs sans exempt pour 8 participants", () => {
    const bracket = generateSingleElimination(players(8));
    expect(bracket.size).toBe(8);
    expect(bracket.rounds).toBe(3);
    expect(bracket.firstRound).toHaveLength(4);
    expect(bracket.firstRound.every((m) => !m.isBye)).toBe(true);
    expect(bracket.firstRound[0]?.a?.seed).toBe(1);
    expect(bracket.firstRound[0]?.b?.seed).toBe(8);
  });

  it("donne les exempts aux meilleures têtes de série", () => {
    const bracket = generateSingleElimination(players(6));
    const byes = bracket.firstRound.filter((m) => m.isBye);
    expect(byes).toHaveLength(2);
    expect(byes.map((m) => m.autoWinner?.seed).sort()).toEqual([1, 2]);
  });

  it("refuse moins de 2 participants", () => {
    expect(() => generateSingleElimination(players(1))).toThrow(RangeError);
  });

  it("refuse deux têtes de série identiques", () => {
    const list = players(3);
    list[2]!.seed = 1;
    expect(() => generateSingleElimination(list)).toThrow(/unique/);
  });
});
