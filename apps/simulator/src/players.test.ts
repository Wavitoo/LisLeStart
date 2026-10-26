import { describe, expect, it } from "vitest";
import { generateTeams } from "./players.js";

describe("generateTeams", () => {
  it("génère le nombre demandé avec des têtes de série uniques", () => {
    const teams = generateTeams(16);
    expect(teams).toHaveLength(16);
    expect(new Set(teams.map((t) => t.seed)).size).toBe(16);
  });
  it("est déterministe pour une même graine", () => {
    expect(generateTeams(8, 7)).toEqual(generateTeams(8, 7));
  });
});
