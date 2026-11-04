import { describe, expect, it, vi } from "vitest";
import { ApiError, createHttpApi } from "./client";
import { createMockApi } from "./mock";

const body = { serverTime: "2026-11-14T15:00:00Z", tournaments: [] };

describe("createHttpApi", () => {
  it("appelle l'endpoint des tournois en cours et renvoie la réponse", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));
    const api = createHttpApi("http://10.0.2.2:4000", fetchImpl);

    await expect(api.liveTournaments()).resolves.toEqual(body);
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://10.0.2.2:4000/tournaments?status=live",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("traduit une réponse en erreur en message lisible", async () => {
    const api = createHttpApi("http://api", async () => new Response("", { status: 503 }));
    await expect(api.liveTournaments()).rejects.toMatchObject({
      name: "ApiError",
      status: 503,
      message: "Le serveur a répondu avec une erreur (503). Réessaie dans un instant.",
    });
  });

  it("signale un serveur injoignable", async () => {
    const api = createHttpApi("http://api", async () => {
      throw new TypeError("Network request failed");
    });
    await expect(api.liveTournaments()).rejects.toBeInstanceOf(ApiError);
  });
});

describe("createMockApi", () => {
  it("ne renvoie que des tournois en cours, avec l'heure du serveur simulé", async () => {
    const now = new Date("2026-11-14T15:00:00Z");
    const { serverTime, tournaments } = await createMockApi(() => now).liveTournaments();

    expect(serverTime).toBe(now.toISOString());
    expect(tournaments.length).toBeGreaterThan(0);
    for (const t of tournaments) {
      expect(Date.parse(t.startsAt)).toBeLessThanOrEqual(now.getTime());
      expect(Date.parse(t.endsAt)).toBeGreaterThan(now.getTime());
    }
  });
});
