import type { Role } from "@lislestart/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuditService } from "../src/audit/audit.service";
import { hashPassword } from "../src/auth/password";
import { createTestApp, type TestApp } from "./support";

let t: TestApp;
let audit: AuditService;
let cookies: Record<Role, string>;
let adminId: string;

beforeEach(async () => {
  t = await createTestApp();
  audit = t.app.get(AuditService);
  const passwordHash = await hashPassword("mot de passe de test");
  cookies = {} as Record<Role, string>;
  for (const role of ["admin", "player", "spectator"] as const) {
    const user = await t.users.create({
      email: `${role}@example.test`,
      displayName: role,
      passwordHash,
      role,
    });
    if (role === "admin") adminId = user.id;
    cookies[role] = await t.sessions.create(user.id);
  }
});

afterEach(async () => {
  await t.app.close();
});

const list = (query: string, role?: Role) =>
  t.app.inject({
    method: "GET",
    url: `/audit${query}`,
    cookies: role ? { sid: cookies[role] } : {},
  });

describe("AuditService", () => {
  it("enregistre qui, quoi, avant, après et quand", async () => {
    const entry = await audit.record({
      actorId: adminId,
      action: "score.corrected",
      target: "match:m1",
      before: { score: [2, 1] },
      after: { score: [1, 2] },
    });

    expect(entry).toMatchObject({
      actorId: adminId,
      action: "score.corrected",
      target: "match:m1",
      before: { score: [2, 1] },
      after: { score: [1, 2] },
    });
    expect(entry.createdAt).toBeInstanceOf(Date);
  });

  it("écrit dans la transaction fournie, avec l'action qu'elle décrit", async () => {
    const tx = { auditLog: { create: vi.fn(async ({ data }) => ({ ...data, id: "tx" })) } };
    await audit.record(
      { actorId: adminId, action: "pickem.resolved", target: "pickem:q1" },
      tx as never,
    );
    expect(tx.auditLog.create).toHaveBeenCalledOnce();
    expect(t.prisma.auditRows).toHaveLength(0);
  });

  it("n'expose aucune méthode de modification ni de suppression", () => {
    const methods = Object.getOwnPropertyNames(AuditService.prototype).filter(
      (m) => m !== "constructor",
    );
    expect(methods.sort()).toEqual(["list", "record"]);
  });
});

describe("GET /audit", () => {
  beforeEach(async () => {
    await audit.record({ actorId: adminId, action: "pickem.created", target: "pickem:q1" });
    await audit.record({ actorId: adminId, action: "score.corrected", target: "match:m1" });
  });

  it("est réservé aux administrateurs", async () => {
    expect((await list("", "spectator")).statusCode).toBe(403);
    expect((await list("", "player")).statusCode).toBe(403);
    expect((await list("")).statusCode).toBe(401);
  });

  it("renvoie les entrées les plus récentes d'abord", async () => {
    const res = await list("", "admin");
    expect(res.statusCode).toBe(200);
    expect(res.json().map((e: { action: string }) => e.action)).toEqual([
      "score.corrected",
      "pickem.created",
    ]);
  });

  it("filtre par cible", async () => {
    const res = await list("?target=match:m1", "admin");
    expect(res.json()).toHaveLength(1);
  });

  it("valide les paramètres", async () => {
    const res = await list("?action=user.deleted&limit=1000", "admin");
    expect(res.statusCode).toBe(400);
    expect(
      res
        .json()
        .errors.map((e: { field: string }) => e.field)
        .sort(),
    ).toEqual(["action", "limit"]);
  });
});
