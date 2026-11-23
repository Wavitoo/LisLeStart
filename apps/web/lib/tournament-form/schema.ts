import { z } from "zod";
import {
  formatLocalDate,
  plural,
  STAGE_FORMAT_LABELS,
  TIEBREAK_PRESETS,
  TIEBREAK_PRESETS_BY_FORMAT,
  type TiebreakPreset,
} from "./labels";

/*
 * Schéma du formulaire « Créer un tournoi ».
 *
 * Les champs numériques arrivent en NaN quand ils sont vides (valueAsNumber) : on les accepte au
 * niveau du type et on les signale dans superRefine. Sinon zod s'arrête à l'erreur de type et les
 * règles croisées (dates, équipes, poules) n'apparaîtraient qu'au deuxième envoi.
 *
 * Chaque message dit ce qui ne va pas, puis comment corriger.
 */

const number = z.union([z.number(), z.nan()]);

const stageSchema = z.object({
  format: z.enum([
    "single_elimination",
    "double_elimination",
    "round_robin",
    "swiss",
    "free_for_all",
  ]),
  /** Jour de l'étape (AAAA-MM-JJ), facultatif. */
  startsOn: z.string(),
  bestOf: number,
  finalBestOf: number,
  seeding: z.enum(["auto", "manual"]),
  stations: z.string(),
  groupCount: number,
  groupSize: number,
  pointsWin: number,
  pointsDraw: number,
  pointsLoss: number,
  tiebreak: z.string(),
  rounds: number,
  playersPerMatch: number,
  matchCount: number,
  placementPoints: z.string(),
  /** Qualifiés par poule (poules) ou au total (suisse, FFA) ; ignoré sur la dernière étape. */
  qualifiers: number,
});

export type StageFormValues = z.infer<typeof stageSchema>;

const baseSchema = z.object({
  name: z.string(),
  gameId: z.string(),
  /** Valeurs d'un <input type="datetime-local"> : AAAA-MM-JJTHH:MM, heure locale. */
  startsAt: z.string(),
  endsAt: z.string(),
  location: z.enum(["online", "onsite", "mixed"]),
  visibility: z.enum(["public", "invite_only"]),
  description: z.string(),
  rules: z.string(),
  participantMode: z.enum(["solo", "team"]),
  teamMin: number,
  teamMax: number,
  capacity: number,
  registrationMode: z.enum(["open", "approval"]),
  waitlist: z.boolean(),
  checkIn: z.boolean(),
  customFields: z.array(z.object({ label: z.string(), required: z.boolean() })),
  stages: z.array(stageSchema),
});

export type TournamentFormValues = z.infer<typeof baseSchema>;

export const LIMITS = {
  nameMin: 3,
  nameMax: 80,
  descriptionMax: 2000,
  rulesMax: 10000,
  capacityMax: 4096,
  teamMax: 50,
  customFieldsMax: 10,
  customFieldLabelMax: 40,
  stationsMax: 40,
} as const;

const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

const isWhole = (value: number) => Number.isInteger(value);
/** 4096 → « 4 096 » avec une espace fine insécable, indépendamment des données ICU de Node. */
export const thousands = (value: number) =>
  String(value).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f");

/** Participants qui entrent dans chaque étape, quand on peut le calculer (null sinon). */
export function stageEntrants(values: Pick<TournamentFormValues, "capacity" | "stages">) {
  const entrants: (number | null)[] = [];
  values.stages.forEach((stage, index) => {
    if (index === 0) {
      entrants.push(isWhole(values.capacity) && values.capacity > 0 ? values.capacity : null);
      return;
    }
    entrants.push(qualifiedFrom(values.stages[index - 1]));
  });
  return entrants;
}

/** Nombre de qualifiés qui sortent d'une étape vers la suivante. */
export function qualifiedFrom(stage: StageFormValues | undefined): number | null {
  if (!stage || !isWhole(stage.qualifiers) || stage.qualifiers < 1) return null;
  if (stage.format === "round_robin") {
    return isWhole(stage.groupCount) && stage.groupCount > 0
      ? stage.qualifiers * stage.groupCount
      : null;
  }
  if (stage.format === "swiss" || stage.format === "free_for_all") return stage.qualifiers;
  return null;
}

/** Exempts d'un arbre à élimination : places manquantes pour atteindre une puissance de 2. */
export function byeCount(entrants: number): number {
  let size = 1;
  while (size < entrants) size *= 2;
  return size - entrants;
}

/** « 10, 6, 4, 2 » → [10, 6, 4, 2] ; renvoie le premier morceau invalide sinon. */
export function parsePlacementPoints(
  value: string,
): { ok: true; points: number[] } | { ok: false; invalid: string } {
  const parts = value
    .split(/[,;]/)
    .map((part) => part.trim())
    .filter((part) => part !== "");
  const points: number[] = [];
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return { ok: false, invalid: part };
    points.push(Number(part));
  }
  return { ok: true, points };
}

export const tournamentFormSchema = baseSchema.superRefine((values, ctx) => {
  const issue = (path: (string | number)[], message: string) =>
    ctx.addIssue({ code: "custom", path, message });

  /** Entier positif : renvoie true si la valeur est utilisable pour les règles croisées. */
  const wholeNumber = (
    path: (string | number)[],
    value: number,
    messages: { empty: string; integer: string; min: [number, string]; max?: [number, string] },
  ): boolean => {
    let message: string | null = null;
    if (Number.isNaN(value)) message = messages.empty;
    else if (!isWhole(value)) message = messages.integer;
    else if (value < messages.min[0]) message = messages.min[1];
    else if (messages.max && value > messages.max[0]) message = messages.max[1];
    if (message) issue(path, message);
    return message === null;
  };

  // --- 1. Informations générales ---

  const name = values.name.trim();
  if (name === "") {
    issue(["name"], "Indique le nom du tournoi : par exemple « Coupe d'hiver ».");
  } else if (name.length < LIMITS.nameMin) {
    issue(
      ["name"],
      `Le nom est trop court (${plural(name.length, "caractère")}) : utilise au moins ${LIMITS.nameMin} caractères.`,
    );
  } else if (name.length > LIMITS.nameMax) {
    issue(
      ["name"],
      `Le nom dépasse ${LIMITS.nameMax} caractères (${name.length}) : raccourcis-le.`,
    );
  }

  if (values.gameId === "") {
    issue(
      ["gameId"],
      "Choisis le jeu du tournoi dans la liste. S'il n'y est pas, déclare-le d'abord dans « Jeux et statistiques ».",
    );
  }

  const startValid = DATE_TIME.test(values.startsAt);
  const endValid = DATE_TIME.test(values.endsAt);
  if (values.startsAt === "") {
    issue(["startsAt"], "Indique la date et l'heure de début : par exemple 13/12/2026 18:00.");
  } else if (!startValid) {
    issue(
      ["startsAt"],
      "La date de début est incomplète : indique le jour et l'heure (JJ/MM/AAAA HH:MM).",
    );
  }
  if (values.endsAt === "") {
    issue(["endsAt"], "Indique la date et l'heure de fin : par exemple 15/12/2026 18:00.");
  } else if (!endValid) {
    issue(
      ["endsAt"],
      "La date de fin est incomplète : indique le jour et l'heure (JJ/MM/AAAA HH:MM).",
    );
  }
  // Même format AAAA-MM-JJTHH:MM des deux côtés : l'ordre alphabétique est l'ordre chronologique.
  if (startValid && endValid && values.endsAt <= values.startsAt) {
    const fix = `choisis une date après le ${formatLocalDate(values.startsAt)}.`;
    issue(
      ["endsAt"],
      values.endsAt === values.startsAt
        ? `La date de fin est identique à la date de début : ${fix}`
        : `La date de fin précède la date de début : ${fix}`,
    );
  }

  if (values.description.length > LIMITS.descriptionMax) {
    issue(
      ["description"],
      `La description dépasse ${thousands(LIMITS.descriptionMax)} caractères (${thousands(values.description.length)}) : raccourcis-la ou déplace le détail dans le règlement.`,
    );
  }
  if (values.rules.length > LIMITS.rulesMax) {
    issue(
      ["rules"],
      `Le règlement dépasse ${thousands(LIMITS.rulesMax)} caractères (${thousands(values.rules.length)}) : raccourcis-le ou mets un lien vers un document complet.`,
    );
  }

  // --- 2. Participants et inscriptions ---

  if (values.participantMode === "team") {
    const minValid = wholeNumber(["teamMin"], values.teamMin, {
      empty: "Indique le nombre de titulaires par équipe : par exemple 5.",
      integer: "Le nombre de titulaires doit être un nombre entier : par exemple 5.",
      min: [
        2,
        "Une équipe compte au moins 2 titulaires : indique 2 ou plus, ou passe le format en Solo.",
      ],
      max: [
        LIMITS.teamMax,
        `Une équipe compte au plus ${LIMITS.teamMax} titulaires : indique une valeur plus petite.`,
      ],
    });
    const maxValid = wholeNumber(["teamMax"], values.teamMax, {
      empty: "Indique la taille max d'une équipe, remplaçants compris : par exemple 7.",
      integer: "La taille max doit être un nombre entier : par exemple 7.",
      min: [
        2,
        "Une équipe compte au moins 2 joueurs : indique 2 ou plus, ou passe le format en Solo.",
      ],
      max: [
        LIMITS.teamMax,
        `Une équipe compte au plus ${LIMITS.teamMax} joueurs : indique une valeur plus petite.`,
      ],
    });
    if (minValid && maxValid && values.teamMax < values.teamMin) {
      issue(
        ["teamMax"],
        `La taille max (${values.teamMax}) est inférieure au nombre de titulaires (${values.teamMin}) : indique au moins ${values.teamMin}.`,
      );
    }
  }

  let capacityValid = false;
  if (Number.isNaN(values.capacity)) {
    issue(["capacity"], "Indique le nombre de places : par exemple 16.");
  } else if (!isWhole(values.capacity)) {
    issue(["capacity"], "Le nombre de places doit être un nombre entier : par exemple 16.");
  } else if (values.capacity <= 0) {
    issue(["capacity"], "Le nombre de places doit être supérieur à 0 : indique au moins 2 places.");
  } else if (values.capacity < 2) {
    issue(
      ["capacity"],
      "Un tournoi se joue à 2 participants au moins : indique au moins 2 places.",
    );
  } else if (values.capacity > LIMITS.capacityMax) {
    issue(
      ["capacity"],
      `${thousands(values.capacity)} places dépasse la limite : indique au plus ${thousands(LIMITS.capacityMax)} places.`,
    );
  } else {
    capacityValid = true;
  }

  if (values.customFields.length > LIMITS.customFieldsMax) {
    issue(
      ["customFields"],
      `${values.customFields.length} champs personnalisés, c'est trop : garde-en ${LIMITS.customFieldsMax} au plus.`,
    );
  }

  // --- 3. Étapes ---

  if (values.stages.length === 0) {
    issue(
      ["stages"],
      "Ajoute au moins une étape : clique sur « + Ajouter une étape » puis choisis son format.",
    );
  }

  const entrants = stageEntrants(values);
  let previousDay: string | null = null;

  values.stages.forEach((stage, index) => {
    const path = (field: keyof StageFormValues) => ["stages", index, field];
    const stageIssue = (field: keyof StageFormValues, message: string) =>
      issue(path(field), `Étape ${index + 1} : ${message}`);
    const stageNumber = (
      field: keyof StageFormValues,
      value: number,
      what: string,
      example: number,
      min: number,
      max: number,
    ) =>
      wholeNumber(path(field), value, {
        empty: `Étape ${index + 1} : indique ${what} : par exemple ${example}.`,
        integer: `Étape ${index + 1} : ${what} doit être un nombre entier : par exemple ${example}.`,
        min: [
          min,
          `Étape ${index + 1} : il faut au moins ${min} pour ${what} : indique ${min} ou plus.`,
        ],
        max: [
          max,
          `Étape ${index + 1} : ${what} ne peut pas dépasser ${max} : indique une valeur plus petite.`,
        ],
      });

    const isLast = index === values.stages.length - 1;
    const stageEntrantCount = entrants[index] ?? null;

    // Jour de l'étape : dans les dates du tournoi et pas avant l'étape précédente.
    if (stage.startsOn !== "") {
      const startDay = startValid ? values.startsAt.slice(0, 10) : null;
      const endDay = endValid ? values.endsAt.slice(0, 10) : null;
      // Dates du tournoi incohérentes : l'erreur est déjà sur Fin, inutile d'en ajouter une par étape.
      const datesOk = startDay !== null && endDay !== null && values.endsAt > values.startsAt;
      if (datesOk && (stage.startsOn < startDay || stage.startsOn > endDay)) {
        stageIssue(
          "startsOn",
          `le ${formatLocalDate(stage.startsOn)} est hors des dates du tournoi : choisis un jour entre le ${formatLocalDate(startDay)} et le ${formatLocalDate(endDay)}.`,
        );
      } else if (previousDay && stage.startsOn < previousDay) {
        stageIssue(
          "startsOn",
          `elle commence avant l'étape ${index} (${formatLocalDate(previousDay)}) : choisis le ${formatLocalDate(previousDay)} ou après.`,
        );
      }
      previousDay = stage.startsOn;
    }

    const allowedTiebreaks = TIEBREAK_PRESETS_BY_FORMAT[stage.format];
    if (
      allowedTiebreaks.length > 0 &&
      !allowedTiebreaks.includes(stage.tiebreak as TiebreakPreset)
    ) {
      const first = allowedTiebreaks[0] as TiebreakPreset;
      stageIssue(
        "tiebreak",
        `choisis un départage adapté au format ${STAGE_FORMAT_LABELS[stage.format]} : par exemple « ${TIEBREAK_PRESETS[first].label} ».`,
      );
    }

    const checkQualifiers = (max: number | null, unit: string) => {
      if (isLast) return;
      const ok = stageNumber(
        "qualifiers",
        stage.qualifiers,
        `le nombre de qualifiés${unit}`,
        2,
        1,
        512,
      );
      if (ok && max !== null && stage.qualifiers > max) {
        stageIssue(
          "qualifiers",
          `${plural(stage.qualifiers, "qualifié")}${unit}, c'est plus que les ${max} participants${unit} : mets ${max} qualifiés au plus.`,
        );
      }
    };

    switch (stage.format) {
      case "single_elimination":
      case "double_elimination": {
        if (stage.finalBestOf < stage.bestOf) {
          stageIssue(
            "finalBestOf",
            `la finale (BO${stage.finalBestOf}) est plus courte que les tours (BO${stage.bestOf}) : choisis BO${stage.bestOf} ou plus pour la finale.`,
          );
        }
        if (stage.stations.length > LIMITS.stationsMax) {
          stageIssue(
            "stations",
            `les postes dépassent ${LIMITS.stationsMax} caractères : écris-les plus court, par exemple « 1 à 8 ».`,
          );
        }
        if (stageEntrantCount !== null && stageEntrantCount < 2) {
          stageIssue(
            "format",
            `un arbre demande au moins 2 participants, il n'en reçoit que ${stageEntrantCount} : augmente les qualifiés de l'étape précédente.`,
          );
        }
        break;
      }

      case "round_robin": {
        const countOk = stageNumber(
          "groupCount",
          stage.groupCount,
          "le nombre de poules",
          4,
          1,
          64,
        );
        const sizeOk = stageNumber("groupSize", stage.groupSize, "la taille des poules", 4, 2, 32);
        const winOk = stageNumber(
          "pointsWin",
          stage.pointsWin,
          "les points d'une victoire",
          3,
          0,
          100,
        );
        const drawOk = stageNumber(
          "pointsDraw",
          stage.pointsDraw,
          "les points d'un nul",
          1,
          0,
          100,
        );
        const lossOk = stageNumber(
          "pointsLoss",
          stage.pointsLoss,
          "les points d'une défaite",
          0,
          0,
          100,
        );
        if (winOk && lossOk && stage.pointsWin <= stage.pointsLoss) {
          stageIssue(
            "pointsWin",
            `une victoire (${plural(stage.pointsWin, "pt")}) doit rapporter plus qu'une défaite (${plural(stage.pointsLoss, "pt")}) : mets au moins ${stage.pointsLoss + 1} pour la victoire.`,
          );
        } else if (
          winOk &&
          drawOk &&
          lossOk &&
          (stage.pointsDraw < stage.pointsLoss || stage.pointsDraw > stage.pointsWin)
        ) {
          stageIssue(
            "pointsDraw",
            `un nul (${plural(stage.pointsDraw, "pt")}) doit valoir entre une défaite (${stage.pointsLoss}) et une victoire (${stage.pointsWin}) : mets une valeur de ${stage.pointsLoss} à ${stage.pointsWin}.`,
          );
        }

        if (countOk && sizeOk) {
          const total = stage.groupCount * stage.groupSize;
          const pools = `${plural(stage.groupCount, "poule")} de ${stage.groupSize}`;
          if (index === 0 && capacityValid && values.capacity !== total) {
            // Message de la maquette : l'erreur porte sur le champ Places.
            issue(
              ["capacity"],
              `${values.capacity} places ne remplissent pas ${pools} : mets ${total} places ou ${values.capacity > total ? "ajoute" : "retire"} une poule.`,
            );
          } else if (index > 0 && stageEntrantCount !== null && stageEntrantCount !== total) {
            const fits = stageEntrantCount % stage.groupSize === 0 && stageEntrantCount > 0;
            stageIssue(
              "groupCount",
              `${plural(stageEntrantCount, "qualifié")} ne remplissent pas ${pools} : ${
                fits
                  ? `mets ${plural(stageEntrantCount / stage.groupSize, "poule")} de ${stage.groupSize}`
                  : `change la taille des poules`
              } ou modifie les qualifiés de l'étape ${index}.`,
            );
          }
        }
        checkQualifiers(sizeOk ? stage.groupSize : null, " par poule");
        break;
      }

      case "swiss": {
        const roundsOk = stageNumber("rounds", stage.rounds, "le nombre de rondes", 5, 1, 30);
        if (roundsOk && stageEntrantCount !== null && stage.rounds > stageEntrantCount - 1) {
          stageIssue(
            "rounds",
            `${plural(stage.rounds, "ronde")} sans rematch demandent au moins ${stage.rounds + 1} participants, il y en a ${stageEntrantCount} : mets ${Math.max(stageEntrantCount - 1, 1)} rondes au plus.`,
          );
        }
        checkQualifiers(stageEntrantCount, "");
        break;
      }

      case "free_for_all": {
        const playersOk = stageNumber(
          "playersPerMatch",
          stage.playersPerMatch,
          "le nombre de joueurs par partie",
          8,
          3,
          100,
        );
        stageNumber("matchCount", stage.matchCount, "le nombre de parties", 3, 1, 50);
        const parsed = parsePlacementPoints(stage.placementPoints);
        if (!parsed.ok) {
          stageIssue(
            "placementPoints",
            `« ${parsed.invalid} » n'est pas un nombre entier : écris les points séparés par des virgules, par exemple 10, 6, 4, 2.`,
          );
        } else if (parsed.points.length === 0) {
          stageIssue(
            "placementPoints",
            "indique les points gagnés à chaque place : par exemple 10, 6, 4, 2.",
          );
        } else if (
          parsed.points.some((points, i) => i > 0 && points > (parsed.points[i - 1] ?? 0))
        ) {
          stageIssue(
            "placementPoints",
            "les points doivent baisser de la 1re à la dernière place : range-les du plus grand au plus petit, par exemple 10, 6, 4, 2.",
          );
        } else if (playersOk && parsed.points.length > stage.playersPerMatch) {
          stageIssue(
            "placementPoints",
            `${parsed.points.length} valeurs pour ${stage.playersPerMatch} joueurs par partie : retire des valeurs ou augmente le nombre de joueurs.`,
          );
        }
        checkQualifiers(stageEntrantCount, "");
        break;
      }
    }
  });
});
