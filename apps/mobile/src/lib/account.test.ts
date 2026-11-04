import { describe, expect, it } from "vitest";
import { errorsByField, roleLabel } from "./account";

describe("compte", () => {
  it("libellé de chaque rôle, administrateur compris", () => {
    expect(roleLabel("spectator")).toBe("Spectateur");
    expect(roleLabel("player")).toBe("Joueur");
    expect(roleLabel("admin")).toBe("Administrateur");
  });

  it("garde la première erreur de chaque champ", () => {
    expect(
      errorsByField([
        { field: "email", message: "Email invalide." },
        { field: "email", message: "Email trop long." },
        { field: "password", message: "Trop court." },
      ]),
    ).toEqual({ email: "Email invalide.", password: "Trop court." });
  });
});
