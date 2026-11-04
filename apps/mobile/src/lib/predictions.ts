import type { MatchUpdatedEvent, PredictionInput, PredictionMatch } from "@lislestart/shared";

/** Un match se verrouille à son début : statut lancé ou heure de verrouillage dépassée. */
export function isLocked(match: PredictionMatch, serverNow: Date): boolean {
  if (match.status !== "scheduled" && match.status !== "called") return true;
  return match.locksAt !== null && Date.parse(match.locksAt) <= serverNow.getTime();
}

/** Les deux participants sont connus : on peut pronostiquer. */
export function isPredictable(match: PredictionMatch): boolean {
  return match.slots.length === 2 && match.slots.every((slot) => slot.participantId !== null);
}

/**
 * Matchs mis en avant : celui en direct (à défaut, le plus récent des terminés) et le prochain à
 * pronostiquer, c'est-à-dire celui dont le pronostic se ferme le plus tôt.
 */
export function featuredMatches(
  matches: readonly PredictionMatch[],
  serverNow: Date,
): { current: PredictionMatch | null; next: PredictionMatch | null } {
  const lastDone =
    matches.filter((m) => m.status === "done").sort((a, b) => lockTime(b) - lockTime(a))[0] ?? null;
  const current = matches.find((m) => m.status === "live") ?? lastDone;
  const next =
    matches
      .filter((m) => isPredictable(m) && !isLocked(m, serverNow))
      .sort((a, b) => lockTime(a) - lockTime(b))[0] ?? null;
  return { current, next };
}

/** Vainqueur d'un match terminé en duel : le meilleur score ; null sinon ou à égalité. */
export function winnerOf(match: PredictionMatch): string | null {
  if (match.status !== "done") return null;
  const [a, b] = match.slots;
  if (!a || !b || a.score === null || b.score === null || a.score === b.score) return null;
  return a.score > b.score ? a.participantId : b.participantId;
}

/** Prono juste ou faux sur le vainqueur, une fois le match terminé ; null sinon. */
export type PredictionOutcome = "exact" | "right" | "wrong";

/**
 * Résultat d'un prono une fois le match terminé : score exact (vainqueur et score), prono juste
 * (vainqueur seulement) ou faux ; null avant la fin. Les points restent calculés par le serveur.
 */
export function predictionOutcome(match: PredictionMatch): PredictionOutcome | null {
  const winner = winnerOf(match);
  if (!winner || !match.myPrediction) return null;
  if (match.myPrediction.winnerId !== winner) return "wrong";
  const score = match.myPrediction.score;
  const exact = score && match.slots.every((slot, i) => slot.score === score[i]);
  return exact ? "exact" : "right";
}

/** Score final à afficher quand le vainqueur était bon mais le score exact pronostiqué faux. */
export function missedScore(match: PredictionMatch): string | null {
  if (predictionOutcome(match) !== "right" || !match.myPrediction?.score) return null;
  const scores = match.slots.map((s) => s.score ?? 0);
  return formatScore(Math.max(...scores), Math.min(...scores));
}

const lockTime = (m: PredictionMatch) => (m.locksAt ? Date.parse(m.locksAt) : Infinity);

/** Manches à gagner pour remporter un BO. */
export const winsNeeded = (bestOf: number) => Math.ceil(bestOf / 2);

/**
 * Scores exacts possibles, vus du vainqueur : BO3 → 2 – 0 et 2 – 1. Vide en BO1, où le score
 * se déduit du vainqueur.
 */
export function scoreOptions(bestOf: number): [number, number][] {
  if (bestOf <= 1) return [];
  const wins = winsNeeded(bestOf);
  return Array.from({ length: wins }, (_, loser) => [wins, loser]);
}

/** Score vu du vainqueur → score dans l'ordre des emplacements du match. */
export function toSlotScore(
  winnerIndex: number,
  [winner, loser]: [number, number],
): [number, number] {
  return winnerIndex === 0 ? [winner, loser] : [loser, winner];
}

/** Scores avec un tiret demi-cadratin, comme dans la charte : « 2 – 1 ». */
export const formatScore = (a: number | null, b: number | null) => `${a ?? 0} – ${b ?? 0}`;

/** Milliers séparés par une espace insécable : « 1 384 ». */
export function formatCount(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function slotName(match: PredictionMatch, participantId: string | null): string {
  return match.slots.find((s) => s.participantId === participantId)?.name ?? "À déterminer";
}

/** Phrase de pronostic : « Les Hiboux, 2 – 1 » ou « Les Hiboux ». */
export function predictionLabel(match: PredictionMatch): string | null {
  const prediction = match.myPrediction;
  if (!prediction) return null;
  const name = slotName(match, prediction.winnerId);
  if (!prediction.score) return name;
  const [a, b] = prediction.score;
  return `${name}, ${formatScore(Math.max(a, b), Math.min(a, b))}`;
}

/** État d'un pronostic de l'utilisateur, du plus récent au plus ancien dans la vie du match. */
export type PredictionState = "open" | "locked" | PredictionOutcome;

export function predictionState(match: PredictionMatch, serverNow: Date): PredictionState | null {
  if (!match.myPrediction) return null;
  const outcome = predictionOutcome(match);
  if (outcome) return outcome;
  return isLocked(match, serverNow) ? "locked" : "open";
}

/** Tous mes pronostics : à venir d'abord (par fermeture), puis verrouillés, puis résolus. */
export function myPredictions(
  matches: readonly PredictionMatch[],
  serverNow: Date,
): PredictionMatch[] {
  const order: Record<PredictionState, number> = {
    open: 0,
    locked: 1,
    exact: 2,
    right: 2,
    wrong: 2,
  };
  const rank = (m: PredictionMatch) => order[predictionState(m, serverNow) ?? "open"];
  return matches
    .filter((m) => m.myPrediction)
    .sort((a, b) => rank(a) - rank(b) || lockTime(a) - lockTime(b));
}

/** Choix en cours dans le formulaire ; le score est vu du vainqueur (2 – 1). */
export interface PredictionDraft {
  winnerId: string | null;
  score: [number, number] | null;
}

/** Formulaire prérempli avec le pronostic déjà enregistré. */
export function draftFrom(match: PredictionMatch): PredictionDraft {
  const saved = match.myPrediction;
  if (!saved) return { winnerId: null, score: null };
  const score = saved.score
    ? ([Math.max(...saved.score), Math.min(...saved.score)] as [number, number])
    : null;
  return { winnerId: saved.winnerId, score };
}

/** Pronostic à envoyer, avec le score remis dans l'ordre des emplacements ; null sans vainqueur. */
export function toPredictionInput(
  match: PredictionMatch,
  draft: PredictionDraft,
): PredictionInput | null {
  const winnerIndex = match.slots.findIndex((s) => s.participantId === draft.winnerId);
  if (!draft.winnerId || winnerIndex === -1) return null;
  const score = draft.score && match.bestOf > 1 ? toSlotScore(winnerIndex, draft.score) : null;
  return { winnerId: draft.winnerId, score };
}

const sameInput = (a: PredictionInput | null, b: PredictionInput | null) =>
  JSON.stringify(a) === JSON.stringify(b);

/**
 * Libellé, état et action du bouton : un bouton désactivé dit toujours pourquoi (charte). Sans
 * compte, il mène à la connexion plutôt que de laisser envoyer un prono refusé.
 */
export function submitButton(
  match: PredictionMatch,
  draft: PredictionDraft,
  { locked, saving, signedIn }: { locked: boolean; saving: boolean; signedIn: boolean },
): { label: string; disabled: boolean; action: "submit" | "signIn" } {
  const submit = (label: string, disabled: boolean) => ({
    label,
    disabled,
    action: "submit" as const,
  });
  if (locked) return submit("Prono fermé", true);
  if (!signedIn)
    return { label: "Se connecter pour pronostiquer", disabled: false, action: "signIn" };
  if (saving) return submit("Enregistrement…", true);
  const input = toPredictionInput(match, draft);
  if (!input) return submit("Choisis un vainqueur", true);
  if (!match.myPrediction) return submit("Valider mon prono", false);
  if (sameInput(input, match.myPrediction)) return submit("Prono enregistré", true);
  return submit("Modifier mon prono", false);
}

/** Applique un événement temps réel au match concerné ; les autres sont renvoyés tels quels. */
export function applyMatchUpdate(
  matches: readonly PredictionMatch[],
  event: MatchUpdatedEvent,
): PredictionMatch[] {
  return matches.map((match) => {
    if (match.id !== event.matchId) return match;
    return {
      ...match,
      status: event.status,
      slots: match.slots.map((slot) => {
        const update = event.slots.find((s) => s.participantId === slot.participantId);
        return update ? { ...slot, score: update.score } : slot;
      }),
    };
  });
}
