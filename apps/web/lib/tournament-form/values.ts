import type { CreateTournamentInput, StageFormat, StageInput } from "@lislestart/shared";
import { TIEBREAK_PRESETS, TIEBREAK_PRESETS_BY_FORMAT, type TiebreakPreset } from "./labels";
import { parsePlacementPoints, type StageFormValues, type TournamentFormValues } from "./schema";

/** Réglages par défaut d'une étape : BO3 et finale BO5 en arbre, BO1 en poules (maquette). */
export function defaultStage(format: StageFormat): StageFormValues {
  const elimination = format === "single_elimination" || format === "double_elimination";
  return {
    format,
    startsOn: "",
    bestOf: elimination ? 3 : 1,
    finalBestOf: 5,
    seeding: "auto",
    stations: "",
    groupCount: 4,
    groupSize: 4,
    pointsWin: 3,
    pointsDraw: 1,
    pointsLoss: 0,
    tiebreak: TIEBREAK_PRESETS_BY_FORMAT[format][0] ?? "",
    rounds: 5,
    playersPerMatch: 8,
    matchCount: 3,
    placementPoints: "10, 6, 4, 2, 1",
    qualifiers: format === "round_robin" ? 2 : 8,
  };
}

export function defaultTournamentValues(): TournamentFormValues {
  return {
    name: "",
    gameId: "",
    startsAt: "",
    endsAt: "",
    location: "onsite",
    visibility: "public",
    description: "",
    rules: "",
    participantMode: "solo",
    teamMin: 5,
    teamMax: 7,
    capacity: Number.NaN,
    registrationMode: "open",
    waitlist: false,
    checkIn: true,
    customFields: [],
    stages: [defaultStage("single_elimination")],
  };
}

/** Le check-in ouvre 30 min avant le début (libellé de la maquette). */
export const CHECK_IN_MINUTES = 30;

function tiebreakers(stage: StageFormValues) {
  return TIEBREAK_PRESETS[stage.tiebreak as TiebreakPreset].tiebreakers.slice();
}

function toStageInput(stage: StageFormValues, isLast: boolean): StageInput {
  const startsOn = stage.startsOn || null;
  const qualifiers = isLast ? null : stage.qualifiers;
  switch (stage.format) {
    case "single_elimination":
    case "double_elimination":
      return {
        format: stage.format,
        startsOn,
        settings: {
          bestOf: stage.bestOf,
          finalBestOf: stage.finalBestOf,
          seeding: stage.seeding,
          stations: stage.stations.trim() || null,
        },
      };
    case "round_robin":
      return {
        format: stage.format,
        startsOn,
        settings: {
          groupCount: stage.groupCount,
          groupSize: stage.groupSize,
          bestOf: stage.bestOf,
          points: { win: stage.pointsWin, draw: stage.pointsDraw, loss: stage.pointsLoss },
          tiebreakers: tiebreakers(stage),
          qualifiersPerGroup: qualifiers,
        },
      };
    case "swiss":
      return {
        format: stage.format,
        startsOn,
        settings: {
          rounds: stage.rounds,
          bestOf: stage.bestOf,
          tiebreakers: tiebreakers(stage),
          qualifiers,
        },
      };
    case "free_for_all": {
      const parsed = parsePlacementPoints(stage.placementPoints);
      return {
        format: stage.format,
        startsOn,
        settings: {
          playersPerMatch: stage.playersPerMatch,
          matchCount: stage.matchCount,
          placementPoints: parsed.ok ? parsed.points : [],
          qualifiers,
        },
      };
    }
  }
}

/**
 * Valeurs validées → corps de `POST /tournaments`. À appeler dans le navigateur : les dates du
 * formulaire sont en heure locale de l'administrateur et partent en ISO 8601 (UTC).
 */
export function toCreateTournamentInput(values: TournamentFormValues): CreateTournamentInput {
  return {
    name: values.name.trim(),
    gameId: values.gameId,
    startsAt: new Date(values.startsAt).toISOString(),
    endsAt: new Date(values.endsAt).toISOString(),
    location: values.location,
    visibility: values.visibility,
    description: values.description.trim() || null,
    rules: values.rules.trim() || null,
    participantMode: values.participantMode,
    teamSize:
      values.participantMode === "team" ? { min: values.teamMin, max: values.teamMax } : null,
    registrationMode: values.registrationMode,
    capacity: values.capacity,
    waitlist: values.waitlist,
    checkInMinutes: values.checkIn ? CHECK_IN_MINUTES : null,
    customFields: values.customFields.map((field) => ({ ...field, label: field.label.trim() })),
    stages: values.stages.map((stage, index) =>
      toStageInput(stage, index === values.stages.length - 1),
    ),
  };
}
