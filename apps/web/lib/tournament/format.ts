import type {
  BracketMatch,
  BracketRound,
  BracketSide,
  BracketSlot,
  CheckInStatus,
  LocationType,
  MatchStatus,
  ParticipantMode,
  Source,
  StageFormat,
  TournamentDetail,
} from "@lislestart/shared";
import { plural } from "@/lib/plural";

/** Les dates sont affichées à l'heure du tournoi, pas à celle du serveur ou du navigateur. */
export const TOURNAMENT_TIME_ZONE = "Europe/Paris";

const SOURCE_LABELS: Record<Source, string> = {
  internal: "Tournoi interne",
  file_import: "Tournoi interne",
  startgg: "Tournoi importé",
};

const LOCATION_LABELS: Record<LocationType, string> = {
  online: "En ligne",
  onsite: "Présentiel",
  mixed: "Mixte",
};

const FORMAT_LABELS: Record<StageFormat, string> = {
  single_elimination: "Élimination simple",
  double_elimination: "Élimination double",
  round_robin: "Poules",
  swiss: "Ronde suisse",
  free_for_all: "FFA",
};

export const SIDE_LABELS: Record<BracketSide, string> = {
  winners: "Tableau principal",
  losers: "Repêchage",
  grand_final: "Grande finale",
};

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  scheduled: "À venir",
  called: "Appelé",
  live: "En direct",
  disputed: "Litige",
  done: "Terminé",
  forfeit: "Forfait",
};

export const CHECK_IN_LABELS: Record<CheckInStatus, string> = {
  checked_in: "Présent",
  pending: "En attente",
  absent: "Absent",
};

export function sourceLabel(source: Source): string {
  return SOURCE_LABELS[source];
}

export function locationLabel(location: LocationType): string {
  return LOCATION_LABELS[location];
}

export function participantCountLabel(count: number, mode: ParticipantMode): string {
  return plural(count, mode === "team" ? "équipe" : "joueur");
}

/** « Élimination double, puis finale BO5 » ; « Poules, puis élimination double ». */
export function formatSummary(detail: Pick<TournamentDetail, "stages" | "finalBestOf">): string {
  const parts = detail.stages.map((stage, index) => {
    const label = FORMAT_LABELS[stage.format];
    return index === 0 ? label : label.toLowerCase();
  });
  if (detail.finalBestOf) parts.push(`finale BO${detail.finalBestOf}`);
  if (parts.length === 0) return "Format à venir";
  const [first = "", ...rest] = parts;
  return [first.charAt(0).toUpperCase() + first.slice(1), ...rest].join(", puis ");
}

// Formateurs créés une fois : chaque ligne du planning et de l'arbre en formate une date.
const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  timeZone: TOURNAMENT_TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});
const TIME_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  timeZone: TOURNAMENT_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});
const DAY_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  timeZone: TOURNAMENT_TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});
const DAY_KEY_FORMAT = new Intl.DateTimeFormat("en-CA", { timeZone: TOURNAMENT_TIME_ZONE });

function parts(iso: string) {
  const values = Object.fromEntries(
    DATE_FORMAT.formatToParts(new Date(iso)).map((part) => [part.type, part.value]),
  );
  return { day: values.day ?? "", month: values.month ?? "", year: values.year ?? "" };
}

/**
 * Début et fin d'une période, à afficher séparés par « – » (chacun dans son <time>) :
 * [« 13 », « 15 décembre »] ; [« 30 novembre », « 2 décembre »] ; années si elles diffèrent.
 * Un seul élément quand tout tient dans la même journée.
 */
export function dateRangeParts(startIso: string, endIso: string): [string] | [string, string] {
  const start = parts(startIso);
  const end = parts(endIso);
  if (start.year !== end.year) {
    return [`${start.day} ${start.month} ${start.year}`, `${end.day} ${end.month} ${end.year}`];
  }
  if (start.month !== end.month) return [`${start.day} ${start.month}`, `${end.day} ${end.month}`];
  if (start.day !== end.day) return [start.day, `${end.day} ${end.month}`];
  return [`${start.day} ${end.month}`];
}

export function formatDateRange(startIso: string, endIso: string): string {
  return dateRangeParts(startIso, endIso).join(" – ");
}

/** « 21:30 ». */
export function formatTime(iso: string): string {
  return TIME_FORMAT.format(new Date(iso));
}

/** « Dimanche 13 décembre ». */
export function formatDay(iso: string): string {
  const label = DAY_FORMAT.format(new Date(iso));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Clé de jour (AAAA-MM-JJ) à l'heure du tournoi, pour regrouper le planning. */
export function dayKey(iso: string): string {
  return DAY_KEY_FORMAT.format(new Date(iso));
}

const SINGULAR_ROUNDS: Record<string, string> = {
  "Seizièmes de finale": "Seizième de finale",
  "Huitièmes de finale": "Huitième de finale",
  "Quarts de finale": "Quart de finale",
  "Demi-finales": "Demi-finale",
};

/** Nom d'un match : « Quart de finale 1 », « Finale », « Repêchage tour 1 · match 2 ». */
export function matchName(round: BracketRound, match: BracketMatch): string {
  const singular = SINGULAR_ROUNDS[round.label];
  if (round.matches.length === 1) return singular ?? round.label;
  return singular ? `${singular} ${match.number}` : `${round.label} · match ${match.number}`;
}

export type SlotKind = "participant" | "tbd" | "bye";

export function slotKind(slot: BracketSlot): SlotKind {
  if (slot.isBye) return "bye";
  return slot.participantId && slot.name ? "participant" : "tbd";
}

/** Texte d'un emplacement : nom, « Vainqueur demie 1 » ou « Exempt ». */
export function slotLabel(slot: BracketSlot): string {
  const kind = slotKind(slot);
  if (kind === "bye") return "Exempt";
  if (kind === "tbd") return slot.placeholder ?? "À déterminer";
  return slot.name ?? "";
}

export function winnerName(match: BracketMatch): string | null {
  if (!match.winnerId) return null;
  return match.slots.find((slot) => slot.participantId === match.winnerId)?.name ?? null;
}

/** Issue d'un match en toutes lettres : « Les Hiboux gagne », « en cours », « à venir, 21:30 ». */
export function matchOutcome(match: BracketMatch): string {
  const winner = winnerName(match);
  switch (match.status) {
    case "done":
      if (!winner) return "terminé";
      return match.slots.some((slot) => slot.isBye)
        ? `${winner} passe (exempt)`
        : `${winner} gagne`;
    case "forfeit":
      return winner ? `${winner} gagne par forfait` : "forfait";
    case "live":
      return "en cours";
    case "called":
      return "appelé, commence bientôt";
    case "disputed":
      return "litige en cours";
    case "scheduled":
      return match.scheduledAt ? `à venir, ${formatTime(match.scheduledAt)}` : "à venir";
  }
}

/**
 * Nom accessible complet d'un match, lu par les lecteurs d'écran :
 * « Quart de finale 1 : Les Hiboux 2, Brise-Glace 0, Les Hiboux gagne ».
 */
export function describeMatch(round: BracketRound, match: BracketMatch): string {
  const slots = match.slots.map((slot) => {
    const kind = slotKind(slot);
    if (kind === "bye") return "exempt";
    if (kind === "tbd" || slot.score === null) return slotLabel(slot);
    return `${slotLabel(slot)} ${slot.score}`;
  });
  return `${matchName(round, match)} : ${slots.join(", ")}, ${matchOutcome(match)}`;
}

/** Regroupe les tours par partie d'arbre (élimination double) en gardant l'ordre. */
export function roundsBySide(
  rounds: BracketRound[],
): { side: BracketSide | null; rounds: BracketRound[] }[] {
  const groups: { side: BracketSide | null; rounds: BracketRound[] }[] = [];
  for (const round of rounds) {
    const side = round.side ?? null;
    const last = groups.at(-1);
    if (last && last.side === side) last.rounds.push(round);
    else groups.push({ side, rounds: [round] });
  }
  return groups;
}

export function isEliminationFormat(format: StageFormat): boolean {
  return format === "single_elimination" || format === "double_elimination";
}

export type TournamentStatus = "live" | "upcoming" | "done";

/** En direct entre le début et la fin, à venir avant, terminé après (heure du serveur Next). */
export function tournamentStatus(
  tournament: { startsAt: string; endsAt: string },
  now: number,
): TournamentStatus {
  if (now < Date.parse(tournament.startsAt)) return "upcoming";
  return now > Date.parse(tournament.endsAt) ? "done" : "live";
}
