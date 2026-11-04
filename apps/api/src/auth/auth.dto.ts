import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { AuthUser, Role } from "@lislestart/shared";
import { Transform } from "class-transformer";
import { IsEmail, IsIn, IsOptional, IsString, Length, MaxLength } from "class-validator";

const trim = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value);
const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

/** Rôles qu'on peut choisir à l'inscription ; un administrateur n'est jamais auto-déclaré. */
export const SELF_SERVICE_ROLES = ["player", "spectator"] as const satisfies readonly Role[];

export class RegisterDto {
  @ApiProperty({ example: "renard.bleu@example.test" })
  @Transform(normalizeEmail)
  @IsEmail({}, { message: "Saisis une adresse email valide, par exemple nom@exemple.fr." })
  @MaxLength(254, { message: "L'email est trop long (254 caractères maximum)." })
  email!: string;

  @ApiProperty({ example: "renard_bleu", minLength: 2, maxLength: 32 })
  @Transform(trim)
  @IsString({ message: "Choisis un pseudo." })
  @Length(2, 32, { message: "Le pseudo doit faire entre 2 et 32 caractères." })
  displayName!: string;

  @ApiProperty({ minLength: 10, maxLength: 128, format: "password" })
  @IsString({ message: "Choisis un mot de passe." })
  @Length(10, 128, {
    message:
      "Le mot de passe doit faire entre 10 et 128 caractères. Une phrase de passe marche bien.",
  })
  password!: string;

  @ApiPropertyOptional({ enum: SELF_SERVICE_ROLES, default: "spectator" })
  @IsOptional()
  @IsIn(SELF_SERVICE_ROLES, { message: "Choisis entre joueur (player) et spectateur (spectator)." })
  role?: (typeof SELF_SERVICE_ROLES)[number];
}

export class LoginDto {
  @ApiProperty({ example: "renard.bleu@example.test" })
  @Transform(normalizeEmail)
  @IsEmail({}, { message: "Saisis une adresse email valide, par exemple nom@exemple.fr." })
  email!: string;

  @ApiProperty({ format: "password" })
  @IsString({ message: "Saisis ton mot de passe." })
  @MaxLength(128, { message: "Le mot de passe fait 128 caractères maximum." })
  password!: string;
}

export class AuthUserDto implements AuthUser {
  @ApiProperty() id!: string;
  @ApiProperty() email!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty({ enum: ["admin", "player", "spectator"] }) role!: Role;
}
