import type { Participant } from "@lislestart/shared";
import { bracketSize, seedOrder } from "./seeding.js";

export interface BracketSlot {
  participant: Participant | null;
}

export interface FirstRoundMatch {
  /** Numéro du match dans le premier tour, à partir de 1. */
  number: number;
  a: Participant | null;
  b: Participant | null;
  /** Vrai si un des deux emplacements est vide : le présent passe directement. */
  isBye: boolean;
  /** Qualifié d'office en cas d'exempt, sinon null. */
  autoWinner: Participant | null;
}

export interface SingleEliminationBracket {
  size: number;
  rounds: number;
  firstRound: FirstRoundMatch[];
}

/**
 * Génère le premier tour d'un arbre à élimination simple.
 * Les exempts sont attribués aux meilleures têtes de série.
 */
export function generateSingleElimination(participants: Participant[]): SingleEliminationBracket {
  if (participants.length < 2) {
    throw new RangeError("Il faut au moins 2 participants pour générer un arbre.");
  }
  const seeds = new Set(participants.map((p) => p.seed));
  if (seeds.size !== participants.length) {
    throw new Error("Chaque participant doit avoir une tête de série unique.");
  }

  const sorted = [...participants].sort((x, y) => x.seed - y.seed);
  const size = bracketSize(sorted.length);
  const order = seedOrder(size);
  const bySeedRank = (rank: number): Participant | null => sorted[rank - 1] ?? null;

  const firstRound: FirstRoundMatch[] = [];
  for (let i = 0; i < order.length; i += 2) {
    const a = bySeedRank(order[i]!);
    const b = bySeedRank(order[i + 1]!);
    const isBye = a === null || b === null;
    firstRound.push({
      number: i / 2 + 1,
      a,
      b,
      isBye,
      autoWinner: isBye ? (a ?? b) : null,
    });
  }

  return { size, rounds: Math.log2(size), firstRound };
}
