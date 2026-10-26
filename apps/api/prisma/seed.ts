/**
 * Données de démonstration : un jeu, ses statistiques et un tournoi vide.
 * Le simulateur (apps/simulator) remplira ensuite joueurs, matchs et pronostics.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const game = await prisma.game.upsert({
    where: { name: "FPS 5v5" },
    update: {},
    create: {
      name: "FPS 5v5",
      statistics: {
        create: [
          {
            key: "map",
            label: "Carte",
            kind: "choice",
            choices: ["Dépôt", "Port", "Usine", "Citadelle"],
          },
          { key: "kills", label: "Kills", kind: "number", choices: [] },
          { key: "mvp", label: "MVP de la manche", kind: "player", choices: [] },
        ],
      },
    },
  });
  console.info(`Jeu de démonstration prêt : ${game.name}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
