import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("mots de passe", () => {
  it("hache en Argon2id avec les paramètres OWASP", async () => {
    const hash = await hashPassword("une phrase de passe");
    expect(hash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
  });

  it("vérifie le bon mot de passe et refuse le mauvais", async () => {
    const hash = await hashPassword("une phrase de passe");
    expect(await verifyPassword(hash, "une phrase de passe")).toBe(true);
    expect(await verifyPassword(hash, "une autre phrase")).toBe(false);
  });

  it("refuse sans lever d'exception une empreinte illisible", async () => {
    expect(await verifyPassword("pas-une-empreinte", "peu importe")).toBe(false);
  });
});
