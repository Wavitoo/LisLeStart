import type { MatchUpdatedEvent } from "@lislestart/shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMockRealtime, MOCK_FINAL_SCORE, mockScenario, type MockStep } from "./mock";
import { createSocketRealtime, type Realtime, type RealtimeSocket } from "./realtime";

/** Faux socket : enregistre les émissions et permet de déclencher les événements serveur. */
class FakeSocket {
  connected = false;
  disconnected = false;
  readonly emitted: [string, unknown][] = [];
  private readonly handlers = new Map<string, ((payload?: unknown) => void)[]>();

  on(event: string, handler: (payload?: unknown) => void) {
    this.handlers.set(event, [...(this.handlers.get(event) ?? []), handler]);
    return this;
  }

  emit(event: string, payload: unknown) {
    this.emitted.push([event, payload]);
    return this;
  }

  disconnect() {
    this.disconnected = true;
    return this;
  }

  /** Connexion ou reconnexion. */
  connect() {
    this.connected = true;
    for (const handler of this.handlers.get("connect") ?? []) handler();
  }

  receive(event: string, payload: unknown) {
    for (const handler of this.handlers.get(event) ?? []) handler(payload);
  }
}

function setup() {
  const sockets: FakeSocket[] = [];
  const realtime = createSocketRealtime("http://api", () => {
    const socket = new FakeSocket();
    sockets.push(socket);
    return socket as unknown as RealtimeSocket;
  });
  return { realtime, sockets };
}

const event = (tournamentId: string): MatchUpdatedEvent => ({
  ...MOCK_FINAL_SCORE,
  tournamentId,
});

describe("client temps réel", () => {
  it("s'abonne aux tournois suivis une fois connecté", () => {
    const { realtime, sockets } = setup();
    realtime.watchTournaments(["t1", "t2"], () => {});
    const socket = sockets[0]!;
    expect(socket.emitted).toEqual([]);

    socket.connect();
    expect(socket.emitted).toEqual([
      ["subscribe", { type: "tournament", id: "t1" }],
      ["subscribe", { type: "tournament", id: "t2" }],
    ]);
  });

  it("se réabonne après une coupure réseau", () => {
    const { realtime, sockets } = setup();
    realtime.watchTournaments(["t1"], () => {});
    const socket = sockets[0]!;
    socket.connect();
    socket.connect();
    expect(socket.emitted.filter(([name]) => name === "subscribe")).toHaveLength(2);
  });

  it("ne transmet à chaque écran que les matchs de ses tournois", () => {
    const { realtime, sockets } = setup();
    const first = vi.fn();
    const second = vi.fn();
    realtime.watchTournaments(["t1"], first);
    realtime.watchTournaments(["t2"], second);
    sockets[0]!.receive("match:updated", event("t2"));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(event("t2"));
  });

  it("partage une seule connexion et garde un tournoi tant qu'un écran le suit", () => {
    const { realtime, sockets } = setup();
    const stopFirst = realtime.watchTournaments(["t1"], () => {});
    const stopSecond = realtime.watchTournaments(["t1"], () => {});
    const socket = sockets[0]!;
    socket.connect();
    expect(sockets).toHaveLength(1);
    expect(socket.emitted).toHaveLength(1);

    stopFirst();
    expect(socket.emitted.some(([name]) => name === "unsubscribe")).toBe(false);
    stopSecond();
    expect(socket.emitted.at(-1)).toEqual(["unsubscribe", { type: "tournament", id: "t1" }]);
    expect(socket.disconnected).toBe(true);
  });

  it("rouvre une connexion si un écran suit à nouveau après la fermeture", () => {
    const { realtime, sockets } = setup();
    realtime.watchTournaments(["t1"], () => {})();
    realtime.watchTournaments(["t1"], () => {});
    expect(sockets).toHaveLength(2);
  });
});

describe("temps réel simulé", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const step = (delayMs: number, matchId: string): MockStep => ({
    delayMs: () => delayMs,
    event: { ...MOCK_FINAL_SCORE, matchId },
  });
  const watch = (realtime: Realtime, onMatch = vi.fn()) =>
    realtime.watchTournaments([MOCK_FINAL_SCORE.tournamentId], onMatch);

  it("joue chaque étape une seule fois et la reporte dans le faux serveur", () => {
    vi.useFakeTimers();
    const publish = vi.fn();
    const realtime = createMockRealtime([step(1000, "a"), step(2000, "b")], publish);
    const onMatch = vi.fn();
    const stop = watch(realtime, onMatch);
    vi.advanceTimersByTime(2000);
    expect(onMatch.mock.calls.map(([e]) => e.matchId)).toEqual(["a", "b"]);
    expect(publish).toHaveBeenCalledTimes(2);
    stop();

    const again = vi.fn();
    watch(realtime, again);
    vi.advanceTimersByTime(5000);
    expect(again).not.toHaveBeenCalled();
  });

  it("met le scénario en pause quand l'écran est quitté et rejoue au retour ce qui est passé", () => {
    vi.useFakeTimers();
    let delay = 1000;
    const realtime = createMockRealtime([{ delayMs: () => delay, event: MOCK_FINAL_SCORE }]);
    const away = vi.fn();
    watch(realtime, away)();
    vi.advanceTimersByTime(1000);
    expect(away).not.toHaveBeenCalled();

    delay = -500; // l'heure prévue est passée pendant l'absence
    const back = vi.fn();
    watch(realtime, back);
    expect(back).toHaveBeenCalledWith(expect.objectContaining({ status: "done" }));
  });

  it("joue la Demi 2 à son verrouillage puis la termine en 30 s", () => {
    const now = Date.parse("2026-11-14T15:00:00Z");
    const steps = mockScenario(new Date(now + 5 * 60_000), () => now);
    expect(steps.map((s) => [s.event.matchId, s.event.status, s.delayMs()])).toEqual([
      ["mock-demi-1", "done", 20_000],
      ["mock-demi-2", "live", 300_000],
      ["mock-demi-2", "live", 315_000],
      ["mock-demi-2", "done", 330_000],
    ]);
    expect(steps.at(-1)?.event.winnerId).toBe("renards");
  });
});
