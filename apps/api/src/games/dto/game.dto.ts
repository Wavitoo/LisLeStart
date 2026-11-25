import { ApiProperty } from "@nestjs/swagger";
import { StatDefinitionDto } from "./stat-definition.dto";

export class GameDto {
  @ApiProperty() id!: string;
  @ApiProperty({ example: "Baby-foot" }) name!: string;
  @ApiProperty({ type: [StatDefinitionDto], description: "Triées par clé." })
  statistics!: StatDefinitionDto[];
}
