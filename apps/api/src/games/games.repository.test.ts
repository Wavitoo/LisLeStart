import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import type { PrismaService } from "../prisma/prisma.service";
import {
  GameNameTakenError,
  GameNotFoundError,
  PrismaGamesRepository,
  StatKeyTakenError,
} from "./games.repository";

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError("erreur simulée", { code, clientVersion: "test" });

const repositoryFailingWith = (error: unknown) => {
  const fail = vi.fn().mockRejectedValue(error);
  const prisma = { game: { create: fail }, statDefinition: { create: fail } };
  return new PrismaGamesRepository(prisma as unknown as PrismaService);
};

const stat = { key: "buts", label: "Buts", kind: "NUMBER" as const, choices: [] };

describe("PrismaGamesRepository : traduction des erreurs Prisma", () => {
  it("nom de jeu en double (P2002) → GameNameTakenError", async () => {
    await expect(repositoryFailingWith(prismaError("P2002")).create("Go")).rejects.toBeInstanceOf(
      GameNameTakenError,
    );
  });

  it("clé de statistique en double (P2002) → StatKeyTakenError", async () => {
    await expect(
      repositoryFailingWith(prismaError("P2002")).addStatistic("g1", stat),
    ).rejects.toBeInstanceOf(StatKeyTakenError);
  });

  it("jeu supprimé entre-temps (P2003) → GameNotFoundError", async () => {
    await expect(
      repositoryFailingWith(prismaError("P2003")).addStatistic("g1", stat),
    ).rejects.toBeInstanceOf(GameNotFoundError);
  });

  it("laisse passer les autres erreurs", async () => {
    const error = new Error("base injoignable");
    await expect(repositoryFailingWith(error).create("Go")).rejects.toBe(error);
  });
});
