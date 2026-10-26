import { generateSingleElimination } from "@lislestart/engine";
import { generateTeams } from "./players.js";

const seed = Number(process.env.SIMULATOR_SEED ?? 42);
const bracket = generateSingleElimination(generateTeams(8, seed));

console.info(`Arbre simulé : ${bracket.size} places, ${bracket.rounds} tours`);
for (const match of bracket.firstRound) {
  console.info(
    `  Match ${match.number} : ${match.a?.name ?? "exempt"} vs ${match.b?.name ?? "exempt"}`,
  );
}
