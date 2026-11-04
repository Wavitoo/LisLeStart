import type { MatchUpdatedEvent, MatchStatus } from "@lislestart/shared";
import type { Realtime } from "./realtime";

/** Un événement du scénario : son délai est calculé à l'ouverture de l'écran qui suit le tournoi. */
export interface MockStep {
  delayMs: () => number;
  event: MatchUpdatedEvent;
}

const TOURNAMENT = "mock-coupe-hiver";

function update(
  matchId: string,
  status: MatchStatus,
  [home, away]: [[string, number], [string, number]],
): MatchUpdatedEvent {
  return {
    tournamentId: TOURNAMENT,
    matchId,
    status,
    slots: [
      { participantId: home[0], score: home[1] },
      { participantId: away[0], score: away[1] },
    ],
    winnerId: status === "done" ? (home[1] > away[1] ? home[0] : away[0]) : null,
    updatedAt: "2026-11-14T15:00:00.000Z",
  };
}

/** Fin de la demi-finale en cours. */
export const MOCK_FINAL_SCORE = update("mock-demi-1", "done", [
  ["hiboux", 2],
  ["kraken", 1],
]);

/**
 * Scénario de démonstration : la Demi 1 se termine 20 s après l'ouverture de Pronos ; la Demi 2
 * démarre à son verrouillage (`demi2LocksAt`), puis se joue en 30 s.
 */
export function mockScenario(demi2LocksAt: Date, now: () => number = Date.now): MockStep[] {
  const afterLock = (ms: number) => () => demi2LocksAt.getTime() + ms - now();
  const demi2 = (status: MatchStatus, renards: number, nova: number) =>
    update("mock-demi-2", status, [
      ["renards", renards],
      ["nova", nova],
    ]);
  return [
    { delayMs: () => 20_000, event: MOCK_FINAL_SCORE },
    { delayMs: afterLock(0), event: demi2("live", 0, 0) },
    { delayMs: afterLock(15_000), event: demi2("live", 1, 0) },
    { delayMs: afterLock(30_000), event: demi2("done", 2, 1) },
  ];
}

/**
 * Temps réel simulé : chaque étape n'est jouée qu'une fois. `publish` reporte l'événement dans
 * le faux serveur, pour qu'un rechargement (connexion, tirer pour actualiser) le retrouve.
 * Les étapes en attente s'arrêtent quand plus aucun écran ne suit, et reprennent au retour.
 */
export function createMockRealtime(
  steps: MockStep[],
  publish: (event: MatchUpdatedEvent) => void = () => {},
): Realtime {
  const watchers = new Set<(event: MatchUpdatedEvent) => void>();
  const pending = new Set(steps);
  let timers: ReturnType<typeof setTimeout>[] = [];

  function play(step: MockStep) {
    pending.delete(step);
    const event = { ...step.event, updatedAt: new Date().toISOString() };
    publish(event);
    for (const watcher of watchers) watcher(event);
  }

  function start() {
    // Étapes déjà passées (écran fermé à ce moment-là) d'abord, dans l'ordre du scénario
    for (const step of [...pending]) {
      const delay = step.delayMs();
      if (delay <= 0) play(step);
      else timers.push(setTimeout(() => play(step), delay));
    }
  }

  return {
    watchTournaments(ids, onMatch) {
      if (!ids.includes(TOURNAMENT)) return () => {};
      watchers.add(onMatch);
      if (watchers.size === 1) start();

      return () => {
        watchers.delete(onMatch);
        if (watchers.size === 0) {
          for (const timer of timers) clearTimeout(timer);
          timers = [];
        }
      };
    },
  };
}
