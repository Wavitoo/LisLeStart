import type { Role } from "@lislestart/shared";
import type { FieldError } from "../api/client";

const ROLES: Record<Role, string> = {
  admin: "Administrateur",
  player: "Joueur",
  spectator: "Spectateur",
};

export const roleLabel = (role: Role) => ROLES[role];

/** Première erreur de chaque champ, pour l'afficher sous le bon champ du formulaire. */
export function errorsByField(errors: readonly FieldError[]): Record<string, string> {
  const byField: Record<string, string> = {};
  for (const { field, message } of errors) byField[field] ??= message;
  return byField;
}
