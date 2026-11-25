import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { MAX_CHOICES, STAT_KINDS, type StatKind } from "../games.schemas";

/** Documentation OpenAPI seulement : la validation est faite par `createStatSchema` (zod). */
export class CreateStatDto {
  @ApiProperty({
    example: "buts",
    pattern: "^[a-z][a-z0-9_]{1,31}$",
    description:
      "Clé technique : minuscules, chiffres et _, commence par une lettre, unique par jeu.",
  })
  key!: string;

  @ApiProperty({ example: "Buts marqués", minLength: 1, maxLength: 80 })
  label!: string;

  @ApiProperty({
    enum: STAT_KINDS,
    example: "NUMBER",
    description: "CHOICE : valeur dans une liste ; NUMBER : nombre ; PLAYER : un joueur du match.",
  })
  kind!: StatKind;

  @ApiPropertyOptional({
    type: [String],
    maxItems: MAX_CHOICES,
    default: [],
    example: ["Dust2", "Mirage"],
    description: "CHOICE : au moins 2 valeurs distinctes non vides. NUMBER et PLAYER : vide.",
  })
  choices?: string[];
}
