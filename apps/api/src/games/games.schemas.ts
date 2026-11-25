import { z } from "zod";

export const STAT_KINDS = ["CHOICE", "NUMBER", "PLAYER"] as const;
export type StatKind = (typeof STAT_KINDS)[number];

export const MAX_CHOICES = 50;

/** Les champs inconnus sont refusés, comme avec le ValidationPipe global. */
const unknownField = { error: "Champ inconnu." };

export const createGameSchema = z.strictObject(
  {
    name: z
      .string({ error: "Donne un nom au jeu." })
      .trim()
      .min(1, { error: "Donne un nom au jeu." })
      .max(80, { error: "Le nom du jeu fait 80 caractères maximum." }),
  },
  unknownField,
);

export type CreateGameInput = z.infer<typeof createGameSchema>;

export const createStatSchema = z
  .strictObject(
    {
      key: z
        .string({ error: "Choisis une clé, par exemple « buts »." })
        .regex(/^[a-z][a-z0-9_]{1,31}$/, {
          error:
            "La clé fait 2 à 32 caractères : minuscules, chiffres et _, en commençant par une lettre (ex. « buts_marques »).",
        }),
      label: z
        .string({ error: "Donne un libellé à la statistique." })
        .trim()
        .min(1, { error: "Donne un libellé à la statistique." })
        .max(80, { error: "Le libellé fait 80 caractères maximum." }),
      kind: z.enum(STAT_KINDS, {
        error: "Choisis un type : CHOICE (liste), NUMBER (nombre) ou PLAYER (joueur).",
      }),
      choices: z
        .array(
          z
            .string({ error: "Chaque choix doit être un texte." })
            .trim()
            .min(1, { error: "Un choix ne peut pas être vide." })
            .max(80, { error: "Un choix fait 80 caractères maximum." }),
          { error: "Les choix doivent être une liste de textes." },
        )
        .max(MAX_CHOICES, { error: `${MAX_CHOICES} choix maximum.` })
        .default([]),
    },
    unknownField,
  )
  .superRefine((stat, ctx) => {
    if (stat.kind === "CHOICE") {
      if (new Set(stat.choices).size !== stat.choices.length) {
        ctx.addIssue({
          code: "custom",
          path: ["choices"],
          message: "Chaque choix doit être différent des autres.",
        });
      } else if (stat.choices.length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["choices"],
          message: 'Une statistique CHOICE demande au moins 2 choix (ex. ["Dust2", "Mirage"]).',
        });
      }
    } else if (stat.choices.length > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["choices"],
        message: `Une statistique ${stat.kind} n'a pas de liste de choix : laisse « choices » vide.`,
      });
    }
  });

export type CreateStatInput = z.infer<typeof createStatSchema>;
