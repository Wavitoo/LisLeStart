import type { Participant } from "@lislestart/shared";
import { createRandom } from "./random.js";

const PREFIXES = ["Les", "Team", "Club", "Nova", "Pixel", "Brise", "Orage"];
const NAMES = ["Hiboux", "Kraken", "Grizzlis", "Fury", "Comètes", "Lynx", "Sirocco", "Faucons"];

/** Génère des équipes fictives : aucune donnée personnelle réelle. */
export function generateTeams(count: number, seed = 42): Participant[] {
  const rand = createRandom(seed);
  const pick = <T>(list: readonly T[]): T => list[Math.floor(rand() * list.length)]!;
  return Array.from({ length: count }, (_, i) => ({
    id: `team-${i + 1}`,
    name: `${pick(PREFIXES)} ${pick(NAMES)} ${i + 1}`,
    seed: i + 1,
  }));
}
