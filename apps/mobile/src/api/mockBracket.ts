import type {
  BracketMatch,
  BracketSlot,
  BracketStage,
  MatchUpdatedEvent,
} from "@lislestart/shared";
import { applyBracketUpdate } from "../lib/bracket";

const team = (participantId: string, name: string, seed: number, score: number | null = null) => ({
  participantId,
  name,
  seed,
  score,
  isBye: false,
});
const tbd: BracketSlot = { participantId: null, name: null, seed: null, score: null, isBye: false };
const bye: BracketSlot = { participantId: null, name: null, seed: null, score: null, isBye: true };

function match(
  id: string,
  number: number,
  bestOf: number,
  status: BracketMatch["status"],
  slots: BracketSlot[],
): BracketMatch {
  const [a, b] = slots;
  let winnerId: string | null = null;
  if (status === "done" && a && b) {
    // Exempt : l'autre participant passe ; sinon, le meilleur score
    if (b.isBye) winnerId = a.participantId;
    else if (a.score !== null && b.score !== null) {
      winnerId = a.score > b.score ? a.participantId : b.participantId;
    }
  }
  return { id, number, bestOf, status, scheduledAt: null, slots, winnerId };
}

/**
 * Arbres fictifs, cohérents avec le reste de la démo : les demies de la Coupe d'hiver sont les
 * matchs de l'onglet Pronos (mêmes identifiants, donc même direct), un seul quart est allé en
 * manche décisive (bonne réponse du Pick'em), et la ligue de babyfoot a un exempt.
 */
export function mockBrackets(): Record<string, BracketStage[]> {
  const hiboux = (s: number | null = null) => team("hiboux", "Les Hiboux", 1, s);
  const renards = (s: number | null = null) => team("renards", "Les Renards", 2, s);
  const nova = (s: number | null = null) => team("nova", "Team Nova", 3, s);
  const kraken = (s: number | null = null) => team("kraken", "Kraken Club", 4, s);

  return {
    "mock-coupe-hiver": [
      {
        id: "stage-coupe-finale",
        name: "Phase finale",
        format: "single_elimination",
        rounds: [
          {
            round: 1,
            label: "Quarts de finale",
            matches: [
              match("mock-quart-1", 1, 3, "done", [hiboux(2), team("pixel", "Pixel Squad", 8, 0)]),
              match("mock-quart-2", 2, 3, "done", [
                kraken(2),
                team("coyotes", "Les Coyotes", 5, 1),
              ]),
              match("mock-quart-3", 3, 3, "done", [
                renards(2),
                team("marmottes", "Les Marmottes", 7, 0),
              ]),
              match("mock-quart-4", 4, 3, "done", [nova(2), team("orage", "Orage FC", 6, 0)]),
            ],
          },
          {
            round: 2,
            label: "Demi-finales",
            matches: [
              match("mock-demi-1", 1, 3, "live", [hiboux(1), kraken(1)]),
              match("mock-demi-2", 2, 3, "scheduled", [renards(), nova()]),
            ],
          },
          {
            round: 3,
            label: "Finale",
            matches: [match("mock-finale", 1, 5, "scheduled", [tbd, tbd])],
          },
        ],
      },
    ],
    "mock-ligue-babyfoot": [
      {
        id: "stage-babyfoot",
        name: "Tableau du jeudi",
        format: "single_elimination",
        rounds: [
          {
            round: 1,
            label: "Tour 1",
            matches: [
              match("mock-babyfoot-t1-1", 1, 1, "done", [
                team("pieds-carres", "Les Pieds Carrés", 2, 1),
                team("ventilos", "Les Ventilos", 3, 0),
              ]),
              match("mock-babyfoot-t1-2", 2, 1, "done", [team("gamelle", "Gamelle FC", 1), bye]),
            ],
          },
          {
            round: 2,
            label: "Tour 2",
            matches: [
              match("mock-babyfoot-t2", 1, 1, "scheduled", [
                team("pieds-carres", "Les Pieds Carrés", 2),
                team("gamelle", "Gamelle FC", 1),
              ]),
            ],
          },
        ],
      },
    ],
    // Arbre pas encore publié : l'écran l'explique
    "mock-open-echecs": [],
  };
}

/** Où va le vainqueur d'un match : identifiant du match suivant et emplacement. */
const NEXT: Record<string, [string, number]> = {
  "mock-demi-1": ["mock-finale", 0],
  "mock-demi-2": ["mock-finale", 1],
};

/**
 * Comme le ferait le serveur : applique le résultat, puis qualifie le vainqueur pour le match
 * suivant (la finale reçoit les vainqueurs des demies).
 */
export function advanceBracket(stages: BracketStage[], event: MatchUpdatedEvent): BracketStage[] {
  const updated = applyBracketUpdate(stages, event);
  const next = NEXT[event.matchId];
  if (event.status !== "done" || !event.winnerId || !next) return updated;

  const matches = updated.flatMap((s) => s.rounds).flatMap((r) => r.matches);
  const winner = matches
    .find((m) => m.id === event.matchId)
    ?.slots.find((s) => s.participantId === event.winnerId);
  if (!winner) return updated;

  const [nextId, index] = next;
  return updated.map((stage) => ({
    ...stage,
    rounds: stage.rounds.map((round) => ({
      ...round,
      matches: round.matches.map((m) =>
        m.id === nextId
          ? { ...m, slots: m.slots.map((s, i) => (i === index ? { ...winner, score: null } : s)) }
          : m,
      ),
    })),
  }));
}
