import { ApiProperty } from "@nestjs/swagger";
import { STAT_KINDS, type StatKind } from "../games.schemas";

export class StatDefinitionDto {
  @ApiProperty() id!: string;
  @ApiProperty({ example: "buts" }) key!: string;
  @ApiProperty({ example: "Buts marqués" }) label!: string;
  @ApiProperty({ enum: STAT_KINDS }) kind!: StatKind;
  @ApiProperty({ type: [String], description: "Vide sauf pour CHOICE." }) choices!: string[];
}
