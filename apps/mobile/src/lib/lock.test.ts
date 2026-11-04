import { describe, expect, it } from "vitest";
import { lockLabel, serverClock } from "./lock";

const now = new Date("2026-12-14T20:00:00Z");
const at = (min: number) => new Date(now.getTime() + min * 60000);

describe("serverClock", () => {
  it("corrige l'horloge du téléphone de l'écart mesuré avec le serveur", () => {
    let device = Date.parse("2026-12-14T19:55:00Z"); // téléphone en retard de 5 min
    const clock = serverClock(now.toISOString(), () => device);
    expect(clock().toISOString()).toBe(now.toISOString());
    device += 60_000;
    expect(clock().toISOString()).toBe(at(1).toISOString());
  });
});

describe("lockLabel", () => {
  it("indique le verrouillage une fois le match commencé", () => {
    expect(lockLabel(now, at(0))).toBe("Pronostic verrouillé");
  });
  it("reste ouvert pendant la dernière minute", () => {
    expect(lockLabel(now, new Date(now.getTime() + 40_000))).toBe("Se ferme dans 1 min");
  });
  it("compte en minutes sous une heure", () => {
    expect(lockLabel(now, at(12))).toBe("Se ferme dans 12 min");
  });
  it("compte en heures au-delà", () => {
    expect(lockLabel(now, at(62))).toBe("Se ferme dans 1 h 02");
  });
});
