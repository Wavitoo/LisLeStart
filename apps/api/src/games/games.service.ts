import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import {
  GameNameTakenError,
  GameNotFoundError,
  GamesRepository,
  StatKeyTakenError,
  type StoredGame,
  type StoredStat,
} from "./games.repository";
import type { CreateGameInput, CreateStatInput } from "./games.schemas";

const gameNotFound = () => new NotFoundException("Jeu introuvable.");

@Injectable()
export class GamesService {
  constructor(private readonly games: GamesRepository) {}

  list(): Promise<StoredGame[]> {
    return this.games.list();
  }

  async get(id: string): Promise<StoredGame> {
    const game = await this.games.findById(id);
    if (!game) throw gameNotFound();
    return game;
  }

  async create({ name }: CreateGameInput): Promise<StoredGame> {
    try {
      return await this.games.create(name);
    } catch (error) {
      if (error instanceof GameNameTakenError) {
        throw new ConflictException("Un jeu porte déjà ce nom.");
      }
      throw error;
    }
  }

  async addStatistic(gameId: string, stat: CreateStatInput): Promise<StoredStat> {
    if (!(await this.games.findById(gameId))) throw gameNotFound();
    try {
      return await this.games.addStatistic(gameId, stat);
    } catch (error) {
      if (error instanceof StatKeyTakenError) {
        throw new ConflictException(`La clé « ${stat.key} » existe déjà pour ce jeu.`);
      }
      if (error instanceof GameNotFoundError) throw gameNotFound();
      throw error;
    }
  }
}
