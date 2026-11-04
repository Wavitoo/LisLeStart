import { describe, expect, it } from "vitest";
import { loadConfig } from "./config";

const secret = "x".repeat(32);

describe("loadConfig", () => {
  it("refuse de démarrer sans SESSION_SECRET suffisant", () => {
    expect(() => loadConfig({})).toThrow(/SESSION_SECRET/);
    expect(() => loadConfig({ SESSION_SECRET: "court" })).toThrow(/SESSION_SECRET/);
  });

  it("cookie Lax et non sécurisé en local", () => {
    expect(loadConfig({ SESSION_SECRET: secret }).cookie).toEqual({
      secure: false,
      sameSite: "lax",
    });
  });

  it("cookie sécurisé en production", () => {
    expect(loadConfig({ SESSION_SECRET: secret, NODE_ENV: "production" }).cookie.secure).toBe(true);
  });

  it("SameSite=None impose Secure", () => {
    expect(loadConfig({ SESSION_SECRET: secret, COOKIE_SAME_SITE: "none" }).cookie).toEqual({
      secure: true,
      sameSite: "none",
    });
  });

  it("pas d'administrateur initial sans ADMIN_EMAIL", () => {
    expect(loadConfig({ SESSION_SECRET: secret }).initialAdmin).toBeNull();
  });

  it("lit l'administrateur initial et normalise son email", () => {
    const config = loadConfig({
      SESSION_SECRET: secret,
      ADMIN_EMAIL: " Admin@Example.TEST ",
      ADMIN_PASSWORD: "phrase de passe admin",
    });
    expect(config.initialAdmin).toEqual({
      email: "admin@example.test",
      displayName: "admin",
      password: "phrase de passe admin",
    });
  });

  it("exige un mot de passe d'au moins 12 caractères avec ADMIN_EMAIL", () => {
    expect(() => loadConfig({ SESSION_SECRET: secret, ADMIN_EMAIL: "admin@example.test" })).toThrow(
      /ADMIN_PASSWORD/,
    );
    expect(() =>
      loadConfig({
        SESSION_SECRET: secret,
        ADMIN_EMAIL: "admin@example.test",
        ADMIN_PASSWORD: "court",
      }),
    ).toThrow(/ADMIN_PASSWORD/);
  });

  it("rejette un ADMIN_EMAIL invalide", () => {
    expect(() =>
      loadConfig({
        SESSION_SECRET: secret,
        ADMIN_EMAIL: "pas-un-email",
        ADMIN_PASSWORD: "x".repeat(12),
      }),
    ).toThrow(/ADMIN_EMAIL/);
  });

  it("rejette une valeur SameSite inconnue", () => {
    expect(() => loadConfig({ SESSION_SECRET: secret, COOKIE_SAME_SITE: "parfois" })).toThrow(
      /COOKIE_SAME_SITE/,
    );
  });
});
