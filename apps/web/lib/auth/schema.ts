import { z } from "zod";
import { plural } from "@/lib/plural";

/*
 * Mêmes règles que les DTO de l'API (apps/api/src/auth/auth.dto.ts), pour signaler les erreurs
 * avant l'envoi. L'API reste juge : ses refus sont aussi affichés sous le bon champ.
 */

export const AUTH_LIMITS = {
  emailMax: 254,
  displayNameMin: 2,
  displayNameMax: 32,
  passwordMin: 10,
  passwordMax: 128,
} as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MESSAGES = {
  emailEmpty: "Indique ton email : par exemple nom@exemple.fr.",
  emailInvalid:
    "Cet email n'est pas valide : vérifie qu'il contient un @ et un domaine, par exemple nom@exemple.fr.",
  emailLong: `L'email dépasse ${AUTH_LIMITS.emailMax} caractères : utilise une adresse plus courte.`,
  passwordEmpty: "Indique ton mot de passe.",
  passwordLoginLong: `Le mot de passe fait ${AUTH_LIMITS.passwordMax} caractères au maximum : vérifie ta saisie.`,
} as const;

function checkEmail(email: string, issue: (message: string) => void) {
  const value = email.trim();
  if (value === "") issue(MESSAGES.emailEmpty);
  else if (value.length > AUTH_LIMITS.emailMax) issue(MESSAGES.emailLong);
  else if (!EMAIL.test(value)) issue(MESSAGES.emailInvalid);
}

export const loginSchema = z
  .object({ email: z.string(), password: z.string() })
  .superRefine((values, ctx) => {
    checkEmail(values.email, (message) =>
      ctx.addIssue({ code: "custom", path: ["email"], message }),
    );
    if (values.password === "") {
      ctx.addIssue({ code: "custom", path: ["password"], message: MESSAGES.passwordEmpty });
    } else if (values.password.length > AUTH_LIMITS.passwordMax) {
      ctx.addIssue({ code: "custom", path: ["password"], message: MESSAGES.passwordLoginLong });
    }
  });

export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    displayName: z.string(),
    email: z.string(),
    password: z.string(),
    role: z.enum(["spectator", "player"]),
  })
  .superRefine((values, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });

    const name = values.displayName.trim();
    if (name === "") {
      issue(
        "displayName",
        "Choisis un pseudo : il apparaîtra dans les classements, par exemple renard_bleu.",
      );
    } else if (name.length < AUTH_LIMITS.displayNameMin) {
      issue(
        "displayName",
        `Le pseudo est trop court (${plural(name.length, "caractère")}) : utilise au moins ${AUTH_LIMITS.displayNameMin} caractères.`,
      );
    } else if (name.length > AUTH_LIMITS.displayNameMax) {
      issue(
        "displayName",
        `Le pseudo dépasse ${AUTH_LIMITS.displayNameMax} caractères (${name.length}) : raccourcis-le.`,
      );
    }

    checkEmail(values.email, (message) => issue("email", message));

    const length = values.password.length;
    if (length === 0) {
      issue(
        "password",
        `Choisis un mot de passe d'au moins ${AUTH_LIMITS.passwordMin} caractères. Une phrase de passe marche bien.`,
      );
    } else if (length < AUTH_LIMITS.passwordMin) {
      issue(
        "password",
        `Le mot de passe est trop court (${plural(length, "caractère")}) : utilise au moins ${AUTH_LIMITS.passwordMin} caractères, par exemple trois mots au hasard.`,
      );
    } else if (length > AUTH_LIMITS.passwordMax) {
      issue(
        "password",
        `Le mot de passe dépasse ${AUTH_LIMITS.passwordMax} caractères (${length}) : raccourcis-le.`,
      );
    }
  });

export type RegisterValues = z.infer<typeof registerSchema>;
