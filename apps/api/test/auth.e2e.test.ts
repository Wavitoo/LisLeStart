import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestApp, sessionCookie, type TestApp } from "./support";

const alice = {
  email: "alice@example.test",
  displayName: "alice",
  password: "une phrase de passe solide",
};

let t: TestApp;

beforeEach(async () => {
  t = await createTestApp();
});

afterEach(async () => {
  await t.app.close();
});

const post = (url: string, payload: object, cookie?: string) =>
  t.app.inject({ method: "POST", url, payload, cookies: cookie ? { sid: cookie } : {} });

const me = (cookie?: string) =>
  t.app.inject({ method: "GET", url: "/auth/me", cookies: cookie ? { sid: cookie } : {} });

describe("inscription", () => {
  it("crée un spectateur, ouvre une session et ne renvoie jamais l'empreinte", async () => {
    const res = await post("/auth/register", alice);

    expect(res.statusCode).toBe(201);
    expect(res.json()).toEqual({
      id: expect.any(String),
      email: alice.email,
      displayName: "alice",
      role: "spectator",
    });
    expect(res.body).not.toContain("argon2");
    expect(t.users.users[0]?.passwordHash).toMatch(/^\$argon2id\$/);
  });

  it("pose un cookie HttpOnly et SameSite", async () => {
    const res = await post("/auth/register", alice);
    const header = [res.headers["set-cookie"]].flat().join(";");
    expect(header).toMatch(/HttpOnly/);
    expect(header).toMatch(/SameSite=Lax/);
  });

  it("normalise l'email", async () => {
    const res = await post("/auth/register", { ...alice, email: "  Alice@Example.TEST " });
    expect(res.json().email).toBe("alice@example.test");
  });

  it("refuse de s'inscrire comme administrateur", async () => {
    const res = await post("/auth/register", { ...alice, role: "admin" });
    expect(res.statusCode).toBe(400);
    expect(res.json().errors).toEqual([
      { field: "role", message: "Choisis entre joueur (player) et spectateur (spectator)." },
    ]);
  });

  it("renvoie une erreur par champ invalide, et rejette les champs inconnus", async () => {
    const res = await post("/auth/register", {
      email: "pas-un-email",
      displayName: "a",
      password: "court",
      isAdmin: true,
    });
    expect(res.statusCode).toBe(400);
    expect(
      res
        .json()
        .errors.map((e: { field: string }) => e.field)
        .sort(),
    ).toEqual(["displayName", "email", "isAdmin", "password"]);
  });

  it("refuse un email déjà pris", async () => {
    await post("/auth/register", alice);
    const res = await post("/auth/register", { ...alice, displayName: "autre" });
    expect(res.statusCode).toBe(409);
  });
});

describe("connexion", () => {
  beforeEach(async () => {
    await post("/auth/register", alice);
  });

  it("ouvre une session utilisable sur /auth/me", async () => {
    const res = await post("/auth/login", { email: alice.email, password: alice.password });
    expect(res.statusCode).toBe(200);

    const profile = await me(sessionCookie(res.headers["set-cookie"]));
    expect(profile.statusCode).toBe(200);
    expect(profile.json().email).toBe(alice.email);
  });

  it("donne le même message pour un mauvais mot de passe et un email inconnu", async () => {
    const wrong = await post("/auth/login", {
      email: alice.email,
      password: "mauvais mot de passe",
    });
    const unknown = await post("/auth/login", {
      email: "bob@example.test",
      password: "peu importe",
    });

    expect(wrong.statusCode).toBe(401);
    expect(unknown.statusCode).toBe(401);
    expect(wrong.json().message).toBe("Email ou mot de passe incorrect.");
    expect(unknown.json().message).toBe(wrong.json().message);
  });

  it("remplace la session précédente (pas de fixation de session)", async () => {
    const first = sessionCookie(
      (await post("/auth/login", { email: alice.email, password: alice.password })).headers[
        "set-cookie"
      ],
    );
    const second = await post(
      "/auth/login",
      { email: alice.email, password: alice.password },
      first,
    );

    expect(sessionCookie(second.headers["set-cookie"])).not.toBe(first);
    expect((await me(first)).statusCode).toBe(401);
  });

  it("limite les tentatives à 5 par minute", async () => {
    const attempts = [];
    for (let i = 0; i < 6; i++) {
      attempts.push(await post("/auth/login", { email: alice.email, password: "mauvais essai" }));
    }
    expect(attempts.slice(0, 5).every((r) => r.statusCode === 401)).toBe(true);
    expect(attempts[5]?.statusCode).toBe(429);
  });
});

describe("session", () => {
  it("refuse /auth/me sans cookie ou avec un cookie inventé", async () => {
    expect((await me()).statusCode).toBe(401);
    expect((await me("cookie-invente")).statusCode).toBe(401);
  });

  it("invalide la session à la déconnexion", async () => {
    const cookie = sessionCookie((await post("/auth/register", alice)).headers["set-cookie"]);

    const res = await post("/auth/logout", {}, cookie);
    expect(res.statusCode).toBe(204);
    expect((await me(cookie)).statusCode).toBe(401);
  });

  it("laisse /health public", async () => {
    expect((await t.app.inject({ method: "GET", url: "/health" })).statusCode).toBe(200);
  });
});
