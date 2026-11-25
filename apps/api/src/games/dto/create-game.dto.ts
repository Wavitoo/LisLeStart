import { ApiProperty } from "@nestjs/swagger";

/** Documentation OpenAPI seulement : la validation est faite par `createGameSchema` (zod). */
export class CreateGameDto {
  @ApiProperty({
    example: "Baby-foot",
    minLength: 1,
    maxLength: 80,
    description: "Nom du jeu, unique (espaces de début et de fin retirés).",
  })
  name!: string;
}
