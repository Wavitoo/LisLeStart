import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateStatInput, StatKind } from "./games.schemas";

export interface StoredStat {
  id: string;
  key: string;
  label: string;
  kind: StatKind;
  choices: string[];
}

export interface StoredGame {
  id: string;
  name: string;
  statistics: StoredStat[];
}

/** Levée quand un autre jeu porte déjà ce nom. */
export class GameNameTakenError extends Error {}
/** Levée quand la clé existe déjà pour ce jeu. */
export class StatKeyTakenError extends Error {}
/** Levée quand le jeu n'existe pas. */
export class GameNotFoundError extends Error {}

/** Accès aux jeux et à leurs statistiques ; remplacé par un faux en mémoire dans les tests. */
export abstract class GamesRepository {
  /** Jeux triés par nom, statistiques triées par clé. */
  abstract list(): Promise<StoredGame[]>;
  abstract findById(id: string): Promise<StoredGame | null>;
  /** @throws GameNameTakenError */
  abstract create(name: string): Promise<StoredGame>;
  /** @throws GameNotFoundError, StatKeyTakenError */
  abstract addStatistic(gameId: string, stat: CreateStatInput): Promise<StoredStat>;
}

const statSelect = { id: true, key: true, label: true, kind: true, choices: true } as const;
const gameSelect = {
  id: true,
  name: true,
  statistics: { select: statSelect, orderBy: { key: "asc" } },
} as const;

const isPrismaError = (error: unknown, code: string): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;

@Injectable()
export class PrismaGamesRepository extends GamesRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  list(): Promise<StoredGame[]> {
    return this.prisma.game.findMany({ select: gameSelect, orderBy: { name: "asc" } });
  }

  findById(id: string): Promise<StoredGame | null> {
    return this.prisma.game.findUnique({ where: { id }, select: gameSelect });
  }

  async create(name: string): Promise<StoredGame> {
    try {
      return await this.prisma.game.create({ data: { name }, select: gameSelect });
    } catch (error) {
      if (isPrismaError(error, "P2002")) throw new GameNameTakenError();
      throw error;
    }
  }

  async addStatistic(gameId: string, stat: CreateStatInput): Promise<StoredStat> {
    try {
      return await this.prisma.statDefinition.create({
        data: { ...stat, gameId },
        select: statSelect,
      });
    } catch (error) {
      if (isPrismaError(error, "P2002")) throw new StatKeyTakenError();
      // Clé étrangère : le jeu a disparu entre la vérification et l'insertion
      if (isPrismaError(error, "P2003")) throw new GameNotFoundError();
      throw error;
    }
  }
}
