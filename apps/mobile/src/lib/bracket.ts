import type {
  BracketMatch,
  BracketSlot,
  BracketStage,
  MatchStatus,
  MatchUpdatedEvent,
  StageFormat,
} from "@lislestart/shared";
import { formatScore } from "./predictions";

const FORMATS: Record<StageFormat, string> = {
  single_elimination: "Élimination simple",
  double_elimination: "Double élimination",
  round_robin: "Poules",
  swiss: "Ronde suisse",
  free_for_all: "Mêlée générale (FFA)",
};

export const formatLabel = (format: StageFormat) => FORMATS[format];

const STATUSES: Record<MatchStatus, string> = {
  scheduled: "À venir",
  called: "Appelé",
  live: "En direct",
  disputed: "En litige",
  done: "Terminé",
  forfeit: "Forfait",
};

export const statusLabel = (status: MatchStatus) => STATUSES[status];

/** Nom affiché d'un emplacement : participant, « Exempt » ou « À déterminer », en mots. */
export function slotLabel(slot: BracketSlot): string {
  if (slot.isBye) return "Exempt";
  return slot.name ?? "À déterminer";
}

/** Le match a commencé : on montre les scores. */
export const hasScore = (match: BracketMatch) =>
  match.status === "live" || match.status === "done" || match.status === "disputed";

/** Phrase lue par TalkBack pour un match : tour, participants, score, état et vainqueur. */
export function matchAccessibilityLabel(match: BracketMatch, roundLabel: string): string {
  const [a, b] = match.slots;
  const names = [a, b].filter(Boolean).map((s) => slotLabel(s as BracketSlot));
  const parts = [`${roundLabel}, match ${match.number}`, names.join(" contre ")];
  if (a?.isBye || b?.isBye) {
    const qualified = [a, b].find((s) => s && !s.isBye);
    if (qualified?.name) parts.push(`${qualified.name} passe au tour suivant`);
    return parts.join(". ");
  }
  if (hasScore(match) && a && b) parts.push(`Score ${formatScore(a.score, b.score)}`);
  parts.push(statusLabel(match.status));
  const winner = match.slots.find((s) => s.participantId && s.participantId === match.winnerId);
  if (winner?.name) parts.push(`Vainqueur : ${winner.name}`);
  return parts.join(". ");
}

/** Applique un score reçu en direct au match concerné, dans toutes les étapes. */
export function applyBracketUpdate(
  stages: readonly BracketStage[],
  event: MatchUpdatedEvent,
): BracketStage[] {
  return stages.map((stage) => ({
    ...stage,
    rounds: stage.rounds.map((round) => ({
      ...round,
      matches: round.matches.map((match) => {
        if (match.id !== event.matchId) return match;
        return {
          ...match,
          status: event.status,
          winnerId: event.winnerId,
          slots: match.slots.map((slot) => {
            const update = event.slots.find((s) => s.participantId === slot.participantId);
            return update ? { ...slot, score: update.score } : slot;
          }),
        };
      }),
    })),
  }));
}

/** Nombre de matchs en direct, pour l'en-tête du tournoi. */
export function liveCount(stages: readonly BracketStage[]): number {
  return stages
    .flatMap((s) => s.rounds)
    .flatMap((r) => r.matches)
    .filter((m) => m.status === "live").length;
}
