import { Controller, Get, Param, Post } from "@nestjs/common";
import type { AuthUser, Role } from "@lislestart/shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { assertOwnerOrAdmin, CurrentUser, Roles } from "../src/auth/access";
import { hashPassword } from "../src/auth/password";
import { createTestApp, type TestApp } from "./support";

/** Routes factices : les vrais endpoints de tournoi arrivent avec le pôle backend. */
@Controller("test")
class ProbeController {
  @Roles("admin")
  @Post("tournaments")
  createTournament() {
    return { created: true };
  }

  @Get("profiles/:ownerId")
  profile(@CurrentUser() user: AuthUser, @Param("ownerId") ownerId: string) {
    assertOwnerOrAdmin(user, ownerId);
    return { ownerId };
  }
}

let t: TestApp;
let cookies: Record<Role, string>;

beforeEach(async () => {
  t = await createTestApp([ProbeController]);
  const passwordHash = await hashPassword("mot de passe de test");
  cookies = {} as Record<Role, string>;
  for (const role of ["admin", "player", "spectator"] as const) {
    const user = await t.users.create({
      email: `${role}@example.test`,
      displayName: role,
      passwordHash,
      role,
    });
    cookies[role] = await t.sessions.create(user.id);
  }
});

afterEach(async () => {
  await t.app.close();
});

const request = (method: "GET" | "POST", url: string, role?: Role) =>
  t.app.inject({ method, url, cookies: role ? { sid: cookies[role] } : {} });

describe("rôles vérifiés côté serveur", () => {
  it("un spectateur ne peut pas créer de tournoi", async () => {
    const res = await request("POST", "/test/tournaments", "spectator");
    expect(res.statusCode).toBe(403);
    expect(res.json().message).toBe("Tu n'as pas les droits pour cette action.");
  });

  it("un joueur non plus", async () => {
    expect((await request("POST", "/test/tournaments", "player")).statusCode).toBe(403);
  });

  it("un administrateur peut", async () => {
    expect((await request("POST", "/test/tournaments", "admin")).statusCode).toBe(201);
  });

  it("sans session, la réponse est 401 et non 403", async () => {
    expect((await request("POST", "/test/tournaments")).statusCode).toBe(401);
  });
});

describe("propriété des ressources (anti-IDOR)", () => {
  it("refuse l'accès à la ressource d'un autre utilisateur", async () => {
    const admin = await t.users.findByEmail("admin@example.test");
    expect((await request("GET", `/test/profiles/${admin!.id}`, "spectator")).statusCode).toBe(403);
  });

  it("autorise le propriétaire", async () => {
    const player = await t.users.findByEmail("player@example.test");
    expect((await request("GET", `/test/profiles/${player!.id}`, "player")).statusCode).toBe(200);
  });

  it("autorise un administrateur", async () => {
    const player = await t.users.findByEmail("player@example.test");
    expect((await request("GET", `/test/profiles/${player!.id}`, "admin")).statusCode).toBe(200);
  });
});
