import { describe, expect, it } from "vitest";
import { defaultDestination, safeDestination } from "./redirect";

describe("safeDestination", () => {
  it("garde un chemin interne", () => {
    expect(safeDestination("/tournois/coupe-hiver#planning", "spectator")).toBe(
      "/tournois/coupe-hiver#planning",
    );
    expect(safeDestination("/admin/tournois/nouveau", "admin")).toBe("/admin/tournois/nouveau");
  });

  it("refuse les redirections ouvertes et retombe sur la page par défaut", () => {
    for (const next of [
      "https://exemple.test",
      "//exemple.test",
      "/\\exemple.test",
      "javascript:alert(1)",
      "tournois",
      `/${"x".repeat(600)}`,
    ]) {
      expect(safeDestination(next, "spectator")).toBe("/tournois");
    }
  });

  it("ne renvoie pas vers les pages de connexion elles-mêmes", () => {
    expect(safeDestination("/connexion", "player")).toBe("/tournois");
    expect(safeDestination("/inscription?suite=/admin", "admin")).toBe("/admin");
  });

  it("sans destination : admin vers le back-office, les autres vers les tournois", () => {
    expect(safeDestination(null, "admin")).toBe("/admin");
    expect(defaultDestination("player")).toBe("/tournois");
  });
});
