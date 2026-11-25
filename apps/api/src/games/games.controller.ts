import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { Roles, SESSION_COOKIE } from "../auth/access";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { CreateGameDto } from "./dto/create-game.dto";
import { CreateStatDto } from "./dto/create-stat.dto";
import { GameDto } from "./dto/game.dto";
import { StatDefinitionDto } from "./dto/stat-definition.dto";
import type { StoredGame, StoredStat } from "./games.repository";
import {
  createGameSchema,
  createStatSchema,
  type CreateGameInput,
  type CreateStatInput,
} from "./games.schemas";
import { GamesService } from "./games.service";

/**
 * Jeux et statistiques relevées à chaque manche. Les corps sont validés par zod ;
 * les classes DTO ne servent qu'à la documentation OpenAPI.
 */
@ApiTags("jeux")
@ApiCookieAuth(SESSION_COOKIE)
@ApiUnauthorizedResponse({ description: "Pas de session valide." })
@ApiForbiddenResponse({ description: "Réservé aux administrateurs." })
@Roles("admin")
@Controller("games")
export class GamesController {
  constructor(private readonly games: GamesService) {}

  @Get()
  @ApiOkResponse({ type: [GameDto], description: "Jeux triés par nom, avec leurs statistiques." })
  list(): Promise<StoredGame[]> {
    return this.games.list();
  }

  @Get(":id")
  @ApiOkResponse({ type: GameDto })
  @ApiNotFoundResponse({ description: "Jeu introuvable." })
  get(@Param("id") id: string): Promise<StoredGame> {
    return this.games.get(id);
  }

  @Post()
  @ApiBody({ type: CreateGameDto })
  @ApiCreatedResponse({ type: GameDto, description: "Jeu créé, sans statistique." })
  @ApiBadRequestResponse({ description: "Nom manquant ou trop long." })
  @ApiConflictResponse({ description: "Un jeu porte déjà ce nom." })
  create(
    @Body(new ZodValidationPipe(createGameSchema)) body: CreateGameInput,
  ): Promise<StoredGame> {
    return this.games.create(body);
  }

  @Post(":gameId/statistics")
  @ApiBody({ type: CreateStatDto })
  @ApiCreatedResponse({ type: StatDefinitionDto, description: "Statistique ajoutée au jeu." })
  @ApiBadRequestResponse({
    description: "Clé ou libellé invalide, ou choix incohérents avec le type.",
  })
  @ApiNotFoundResponse({ description: "Jeu introuvable." })
  @ApiConflictResponse({ description: "Cette clé existe déjà pour ce jeu." })
  addStatistic(
    @Param("gameId") gameId: string,
    @Body(new ZodValidationPipe(createStatSchema)) body: CreateStatInput,
  ): Promise<StoredStat> {
    return this.games.addStatistic(gameId, body);
  }
}
