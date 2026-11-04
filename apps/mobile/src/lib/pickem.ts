import type { PickemQuestionView, PickemStatus } from "@lislestart/shared";
import { formatCount } from "./predictions";

/** Statut à l'heure du serveur : une question ouverte dont la clôture est passée est fermée. */
export function effectiveStatus(question: PickemQuestionView, serverNow: Date): PickemStatus {
  if (question.status === "open" && Date.parse(question.closesAt) <= serverNow.getTime()) {
    return "locked";
  }
  return question.status;
}

/** Ce que l'utilisateur voit de sa réponse, de l'ouverture à la résolution. */
export type AnswerState = "todo" | "answered" | "locked" | "won" | "lost" | "missed" | "cancelled";

export function answerState(question: PickemQuestionView, serverNow: Date): AnswerState {
  const status = effectiveStatus(question, serverNow);
  if (status === "cancelled") return "cancelled";
  if (status === "resolved") {
    if (!question.myAnswer) return "missed";
    return question.myAnswer === question.correctOptionId ? "won" : "lost";
  }
  if (status === "locked") return question.myAnswer ? "locked" : "missed";
  return question.myAnswer ? "answered" : "todo";
}

/** Progression de la maquette : questions encore ouvertes auxquelles j'ai répondu. */
export function progress(
  questions: readonly PickemQuestionView[],
  serverNow: Date,
): { answered: number; total: number } {
  const open = questions.filter((q) => effectiveStatus(q, serverNow) === "open");
  return { answered: open.filter((q) => q.myAnswer).length, total: open.length };
}

/** Points gagnés sur les questions résolues. */
export function pointsWon(questions: readonly PickemQuestionView[], serverNow: Date): number {
  return questions
    .filter((q) => answerState(q, serverNow) === "won")
    .reduce((sum, q) => sum + q.points, 0);
}

/** Ouvertes d'abord (par clôture), puis fermées, résolues et annulées. */
export function sortQuestions(
  questions: readonly PickemQuestionView[],
  serverNow: Date,
): PickemQuestionView[] {
  const order: Record<PickemStatus, number> = { open: 0, locked: 1, resolved: 2, cancelled: 3 };
  return [...questions].sort(
    (a, b) =>
      order[effectiveStatus(a, serverNow)] - order[effectiveStatus(b, serverNow)] ||
      Date.parse(a.closesAt) - Date.parse(b.closesAt),
  );
}

/** « 1 240 pts », avec l'espace des milliers de la charte. */
export const formatPoints = (points: number) => formatCount(points) + "\u00a0pts";

/** Part du public pour une option, ou null avant la clôture. */
export function optionPercent(question: PickemQuestionView, optionId: string): number | null {
  return question.distribution?.find((d) => d.optionId === optionId)?.percent ?? null;
}
