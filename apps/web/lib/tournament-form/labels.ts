import type {
  LocationType,
  ParticipantMode,
  RegistrationMode,
  SeedingMode,
  StageFormat,
  Tiebreaker,
  Visibility,
} from "@lislestart/shared";

export const STAGE_FORMATS: StageFormat[] = [
  "single_elimination",
  "double_elimination",
  "round_robin",
  "swiss",
  "free_for_all",
];

export const STAGE_FORMAT_LABELS: Record<StageFormat, string> = {
  single_elimination: "Élimination simple",
  double_elimination: "Élimination double",
  round_robin: "Poules (round robin)",
  swiss: "Ronde suisse",
  free_for_all: "FFA (chacun pour soi)",
};

export const LOCATION_LABELS: Record<LocationType, string> = {
  online: "En ligne",
  onsite: "Présentiel",
  mixed: "Mixte",
};

export const VISIBILITY_LABELS: Record<Visibility, string> = {
  public: "Public",
  invite_only: "Sur invitation",
};

export const PARTICIPANT_MODE_LABELS: Record<ParticipantMode, string> = {
  solo: "Solo",
  team: "En équipe",
};

export const REGISTRATION_MODE_LABELS: Record<RegistrationMode, string> = {
  open: "Ouvertes",
  approval: "Sur validation",
};

export const SEEDING_LABELS: Record<SeedingMode, string> = {
  auto: "Automatique",
  manual: "Manuel",
};

export const BEST_OF_OPTIONS = [1, 3, 5] as const;

/** Départages proposés, dans l'ordre d'application. */
export const TIEBREAK_PRESETS = {
  head_to_head_games: {
    label: "Confrontation directe, diff. de manches",
    tiebreakers: ["head_to_head", "game_difference"],
  },
  games_head_to_head: {
    label: "Diff. de manches, confrontation directe",
    tiebreakers: ["game_difference", "head_to_head"],
  },
  buchholz_head_to_head: {
    label: "Buchholz, confrontation directe",
    tiebreakers: ["buchholz", "head_to_head"],
  },
  buchholz_games: {
    label: "Buchholz, diff. de manches",
    tiebreakers: ["buchholz", "game_difference"],
  },
  points_scored: {
    label: "Points marqués",
    tiebreakers: ["points_scored"],
  },
} as const satisfies Record<string, { label: string; tiebreakers: Tiebreaker[] }>;

export type TiebreakPreset = keyof typeof TIEBREAK_PRESETS;

export const TIEBREAK_PRESETS_BY_FORMAT: Record<StageFormat, TiebreakPreset[]> = {
  single_elimination: [],
  double_elimination: [],
  round_robin: ["head_to_head_games", "games_head_to_head"],
  swiss: ["buchholz_head_to_head", "buchholz_games"],
  free_for_all: ["points_scored"],
};

/** « 2026-12-13T18:00 » → « 13/12/2026 à 18:00 » ; « 2026-12-13 » → « 13/12/2026 ». */
export function formatLocalDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(value);
  if (!match) return value;
  const [, year, month, day, hours, minutes] = match;
  const date = `${day}/${month}/${year}`;
  return hours ? `${date} à ${hours}:${minutes}` : date;
}

const MONTHS = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

/** « 2026-12-13 » → « 13 déc. », comme dans l'en-tête des cartes d'étape. */
export function formatShortDay(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "";
  const month = MONTHS[Number(match[2]) - 1];
  return month ? `${Number(match[3])} ${month}` : "";
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${Math.abs(count) >= 2 ? pluralForm : singular}`;
}
