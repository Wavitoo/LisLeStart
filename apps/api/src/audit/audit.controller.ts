import { Controller, Get, Query } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { Roles, SESSION_COOKIE } from "../auth/access";
import { AUDIT_ACTIONS, AuditService, type AuditAction, type AuditEntry } from "./audit.service";

export class AuditQueryDto {
  @ApiPropertyOptional({ example: "match:clx123" })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: "La cible fait 200 caractères maximum." })
  target?: string;

  @ApiPropertyOptional({ enum: AUDIT_ACTIONS })
  @IsOptional()
  @IsIn(AUDIT_ACTIONS, { message: `Action inconnue (attendu : ${AUDIT_ACTIONS.join(", ")}).` })
  action?: AuditAction;

  @ApiPropertyOptional({ description: "Id de la dernière entrée reçue, pour la page suivante." })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "La limite doit être un nombre entier." })
  @Min(1, { message: "La limite doit être au moins 1." })
  @Max(200, { message: "La limite est de 200 entrées maximum." })
  limit?: number;
}

class AuditEntryDto implements AuditEntry {
  @ApiProperty() id!: string;
  @ApiProperty() actorId!: string;
  @ApiProperty({ enum: AUDIT_ACTIONS }) action!: string;
  @ApiProperty() target!: string;
  @ApiProperty({ nullable: true, type: Object }) before!: AuditEntry["before"];
  @ApiProperty({ nullable: true, type: Object }) after!: AuditEntry["after"];
  @ApiProperty() createdAt!: Date;
}

@ApiTags("journal d'audit")
@ApiCookieAuth(SESSION_COOKIE)
@Roles("admin")
@Controller("audit")
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @ApiOkResponse({ type: [AuditEntryDto], description: "Entrées les plus récentes d'abord." })
  @ApiForbiddenResponse({ description: "Réservé aux administrateurs." })
  list(@Query() query: AuditQueryDto): Promise<AuditEntry[]> {
    return this.audit.list({ ...query, limit: query.limit ?? 50 });
  }
}
