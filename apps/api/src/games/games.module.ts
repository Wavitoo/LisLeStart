import { Module } from "@nestjs/common";
import { GamesController } from "./games.controller";
import { GamesRepository, PrismaGamesRepository } from "./games.repository";
import { GamesService } from "./games.service";

@Module({
  controllers: [GamesController],
  providers: [GamesService, { provide: GamesRepository, useClass: PrismaGamesRepository }],
  exports: [GamesService],
})
export class GamesModule {}
