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

  it("rejette une valeur SameSite inconnue", () => {
    expect(() => loadConfig({ SESSION_SECRET: secret, COOKIE_SAME_SITE: "parfois" })).toThrow(
      /COOKIE_SAME_SITE/,
    );
  });
});
