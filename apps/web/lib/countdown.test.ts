import { describe, expect, it } from "vitest";
import { formatCountdown } from "./countdown";

describe("formatCountdown", () => {
  it("affiche heures et minutes", () => {
    expect(formatCountdown(2 * 3600 + 14 * 60)).toBe("2 h 14");
  });
  it("affiche seulement les minutes sous une heure", () => {
    expect(formatCountdown(5 * 60)).toBe("5 min");
  });
  it("ne descend pas sous zéro", () => {
    expect(formatCountdown(-10)).toBe("0 min");
  });
});
