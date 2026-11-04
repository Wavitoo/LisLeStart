import type {
  ClientToServerEvents,
  MatchUpdatedEvent,
  RealtimeAck,
  RealtimeSubscription,
  ServerToClientEvents,
} from "@lislestart/shared";
import { io, type Socket } from "socket.io-client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { hashPassword } from "../src/auth/password";
import { MAX_SUBSCRIPTIONS } from "../src/realtime/realtime.gateway";
import { RealtimeService } from "../src/realtime/realtime.service";
import { createTestApp, type TestApp } from "./support";

type Client = Socket<ServerToClientEvents, ClientToServerEvents>;

let t: TestApp;
let url: string;
let realtime: RealtimeService;
const clients: Client[] = [];

beforeEach(async () => {
  t = await createTestApp();
  t.realtime.tournaments.set("public", { isPublic: true });
  t.realtime.tournaments.set("other", { isPublic: true });
  t.realtime.tournaments.set("private", { isPublic: false });
  t.realtime.matches.set("m1", "public");
  t.realtime.matches.set("m2", "public");
  t.realtime.matches.set("secret-match", "private");
  await t.app.listen(0, "127.0.0.1");
  url = await t.app.getUrl();
  realtime = t.app.get(RealtimeService);
});

afterEach(async () => {
  for (const client of clients.splice(0)) client.disconnect();
  await t.app.close();
});

/** Client connecté, avec le cookie de session si fourni. */
async function connect(sessionId?: string): Promise<Client> {
  const client: Client = io(url, {
    transports: ["websocket"],
    extraHeaders: sessionId ? { cookie: `sid=${sessionId}` } : {},
  });
  clients.push(client);
  await new Promise<void>((resolve, reject) => {
    client.once("connect", resolve);
    client.once("connect_error", reject);
  });
  return client;
}

const subscribe = (client: Client, subscription: RealtimeSubscription): Promise<RealtimeAck> =>
  client.emitWithAck("subscribe", subscription);

/** Collecte les événements reçus jusqu'à ce que `count` soient arrivés. */
function collect(client: Client, count: number): Promise<MatchUpdatedEvent[]> {
  const received: MatchUpdatedEvent[] = [];
  return new Promise((resolve) => {
    client.on("match:updated", (event) => {
      received.push(event);
      if (received.length === count) resolve(received);
    });
  });
}

const update = (tournamentId: string, matchId: string): MatchUpdatedEvent => ({
  tournamentId,
  matchId,
  status: "done",
  slots: [
    { participantId: "a", score: 2 },
    { participantId: "b", score: 1 },
  ],
  winnerId: "a",
  updatedAt: "2026-11-15T14:00:00.000Z",
});

async function adminSession(): Promise<string> {
  const admin = await t.users.create({
    email: "admin@example.test",
    displayName: "admin",
    passwordHash: await hashPassword("mot de passe de test"),
    role: "admin",
  });
  return t.sessions.create(admin.id);
}

describe("temps réel : diffusion des résultats", () => {
  it("un visiteur anonyme suit un tournoi public et reçoit le résultat d'un match", async () => {
    const client = await connect();
    expect(await subscribe(client, { type: "tournament", id: "public" })).toEqual({ ok: true });

    const received = collect(client, 1);
    realtime.matchUpdated(update("public", "m1"));
    expect(await received).toEqual([update("public", "m1")]);
  });

  it("un abonné à un seul match ne reçoit que ce match", async () => {
    const client = await connect();
    await subscribe(client, { type: "match", id: "m1" });

    const received = collect(client, 1);
    realtime.matchUpdated(update("public", "m2"));
    realtime.matchUpdated(update("public", "m1"));
    // Les messages d'un socket arrivent dans l'ordre : m2 aurait précédé m1
    expect((await received).map((e) => e.matchId)).toEqual(["m1"]);
  });

  it("n'envoie rien aux abonnés d'un autre tournoi", async () => {
    const client = await connect();
    await subscribe(client, { type: "tournament", id: "other" });

    const received = collect(client, 1);
    realtime.matchUpdated(update("public", "m1"));
    realtime.matchUpdated(update("other", "m3"));
    expect((await received).map((e) => e.tournamentId)).toEqual(["other"]);
  });

  it("un client abonné au tournoi et au match reçoit l'événement une seule fois", async () => {
    const client = await connect();
    await subscribe(client, { type: "tournament", id: "public" });
    await subscribe(client, { type: "match", id: "m1" });

    const received = collect(client, 2);
    realtime.matchUpdated(update("public", "m1"));
    realtime.matchUpdated(update("public", "m2"));
    expect((await received).map((e) => e.matchId)).toEqual(["m1", "m2"]);
  });

  it("après désabonnement, plus rien n'arrive", async () => {
    const client = await connect();
    await subscribe(client, { type: "tournament", id: "public" });
    await subscribe(client, { type: "tournament", id: "other" });
    expect(await client.emitWithAck("unsubscribe", { type: "tournament", id: "public" })).toEqual({
      ok: true,
    });

    const received = collect(client, 1);
    realtime.matchUpdated(update("public", "m1"));
    realtime.matchUpdated(update("other", "m3"));
    expect((await received).map((e) => e.tournamentId)).toEqual(["other"]);
  });

  it("annonce les changements de classement aux abonnés du tournoi", async () => {
    const client = await connect();
    await subscribe(client, { type: "tournament", id: "public" });

    const received = new Promise((resolve) => client.once("standings:updated", resolve));
    realtime.standingsUpdated({ tournamentId: "public", updatedAt: "2026-11-15T14:00:00.000Z" });
    expect(await received).toEqual({
      tournamentId: "public",
      updatedAt: "2026-11-15T14:00:00.000Z",
    });
  });
});

describe("temps réel : contrôle des abonnements", () => {
  const notFound = { ok: false, error: "Tournoi ou match introuvable." };

  it("refuse un tournoi ou un match inconnu", async () => {
    const client = await connect();
    expect(await subscribe(client, { type: "tournament", id: "inconnu" })).toEqual(notFound);
    expect(await subscribe(client, { type: "match", id: "inconnu" })).toEqual(notFound);
  });

  it("un tournoi privé est refusé sans révéler qu'il existe", async () => {
    const client = await connect();
    expect(await subscribe(client, { type: "tournament", id: "private" })).toEqual(notFound);
    expect(await subscribe(client, { type: "match", id: "secret-match" })).toEqual(notFound);
  });

  it("un administrateur connecté suit un tournoi privé", async () => {
    const client = await connect(await adminSession());
    expect(await subscribe(client, { type: "tournament", id: "private" })).toEqual({ ok: true });
  });

  it("un cookie invalide est traité comme un visiteur anonyme", async () => {
    const client = await connect("session-inexistante");
    expect(await subscribe(client, { type: "tournament", id: "private" })).toEqual(notFound);
    expect(await subscribe(client, { type: "tournament", id: "public" })).toEqual({ ok: true });
  });

  it("refuse un abonnement mal formé", async () => {
    const client = await connect();
    for (const body of [null, "public", { type: "user", id: "x" }, { type: "match", id: "a b" }]) {
      const ack = await client.emitWithAck("subscribe", body as unknown as RealtimeSubscription);
      expect(ack).toEqual({ ok: false, error: expect.stringContaining("Abonnement invalide") });
    }
  });

  it(`limite un client à ${MAX_SUBSCRIPTIONS} abonnements`, async () => {
    for (let i = 0; i <= MAX_SUBSCRIPTIONS; i++)
      t.realtime.tournaments.set(`t${i}`, { isPublic: true });
    const client = await connect();
    for (let i = 0; i < MAX_SUBSCRIPTIONS; i++) {
      expect(await subscribe(client, { type: "tournament", id: `t${i}` })).toEqual({ ok: true });
    }
    expect(await subscribe(client, { type: "tournament", id: `t${MAX_SUBSCRIPTIONS}` })).toEqual({
      ok: false,
      error: `Limite de ${MAX_SUBSCRIPTIONS} abonnements atteinte.`,
    });
    // Se réabonner à une room déjà suivie ne compte pas
    expect(await subscribe(client, { type: "tournament", id: "t0" })).toEqual({ ok: true });
  });
});
