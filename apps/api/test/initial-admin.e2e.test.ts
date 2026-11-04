import { afterEach, describe, expect, it } from "vitest";
import { ensureInitialAdmin } from "../src/auth/initial-admin";
import { hashPassword } from "../src/auth/password";
import { createTestApp, MemoryUsersRepository, sessionCookie, type TestApp } from "./support";

const admin = {
  email: "admin@example.test",
  displayName: "admin",
  password: "phrase de passe admin de test",
};

describe("ensureInitialAdmin", () => {
  it("crée l'administrateur avec un mot de passe haché", async () => {
    const users = new MemoryUsersRepository();

    expect(await ensureInitialAdmin(users, admin)).toBe("created");
    expect(users.users[0]).toMatchObject({ email: admin.email, role: "admin" });
    expect(users.users[0]?.passwordHash).toMatch(/^\$argon2id\$/);
  });

  it("ne fait rien si l'administrateur existe déjà", async () => {
    const users = new MemoryUsersRepository();
    await ensureInitialAdmin(users, admin);

    expect(await ensureInitialAdmin(users, admin)).toBe("already-admin");
    expect(users.users).toHaveLength(1);
  });

  it("ne promeut jamais un compte existant non administrateur", async () => {
    const users = new MemoryUsersRepository();
    await users.create({
      email: admin.email,
      displayName: "inscrit-avant",
      passwordHash: await hashPassword("un autre mot de passe"),
      role: "spectator",
    });

    expect(await ensureInitialAdmin(users, admin)).toBe("email-taken");
    expect(users.users[0]?.role).toBe("spectator");
  });
});

describe("au démarrage de l'API", () => {
  let t: TestApp | undefined;

  afterEach(async () => {
    await t?.app.close();
  });

  it("l'administrateur configuré peut se connecter et accéder au journal d'audit", async () => {
    t = await createTestApp([], { initialAdmin: admin });

    const login = await t.app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: admin.email, password: admin.password },
    });
    expect(login.statusCode).toBe(200);
    expect(login.json().role).toBe("admin");

    const audit = await t.app.inject({
      method: "GET",
      url: "/audit",
      cookies: { sid: sessionCookie(login.headers["set-cookie"]) },
    });
    expect(audit.statusCode).toBe(200);
  });

  it("sans ADMIN_EMAIL, aucun compte n'est créé", async () => {
    t = await createTestApp();
    expect(t.users.users).toHaveLength(0);
  });
});
