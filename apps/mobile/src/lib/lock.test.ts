import { describe, expect, it } from "vitest";
import { lockLabel } from "./lock";

const now = new Date("2026-12-14T20:00:00Z");
const at = (min: number) => new Date(now.getTime() + min * 60000);

describe("lockLabel", () => {
  it("indique le verrouillage une fois le match commencé", () => {
    expect(lockLabel(now, at(0))).toBe("Pronostic verrouillé");
  });
  it("compte en minutes sous une heure", () => {
    expect(lockLabel(now, at(12))).toBe("Se ferme dans 12 min");
  });
  it("compte en heures au-delà", () => {
    expect(lockLabel(now, at(62))).toBe("Se ferme dans 1 h 02");
  });
});
