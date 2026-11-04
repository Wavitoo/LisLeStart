import type { PickemQuestionView } from "@lislestart/shared";
import { describe, expect, it } from "vitest";
import {
  answerState,
  effectiveStatus,
  formatPoints,
  optionPercent,
  pointsWon,
  progress,
  sortQuestions,
} from "./pickem";

const now = new Date("2026-12-20T15:00:00Z");
const at = (min: number) => new Date(now.getTime() + min * 60_000).toISOString();

function question(overrides: Partial<PickemQuestionView> = {}): PickemQuestionView {
  return {
    id: "q",
    tournamentId: "t",
    tournamentName: "Coupe d'hiver",
    template: "yes_no",
    title: "Un 3 – 0 en finale ?",
    status: "open",
    closesAt: at(30),
    points: 10,
    options: [
      { id: "oui", label: "Oui" },
      { id: "non", label: "Non" },
    ],
    myAnswer: null,
    correctOptionId: null,
    cancelReason: null,
    distribution: null,
    answerCount: 0,
    ...overrides,
  };
}

describe("statut à l'heure du serveur", () => {
  it("une question ouverte se ferme à sa clôture", () => {
    expect(effectiveStatus(question(), now)).toBe("open");
    expect(effectiveStatus(question({ closesAt: at(0) }), now)).toBe("locked");
  });

  it("ne touche pas aux questions résolues ou annulées", () => {
    expect(effectiveStatus(question({ status: "resolved", closesAt: at(-10) }), now)).toBe(
      "resolved",
    );
    expect(effectiveStatus(question({ status: "cancelled" }), now)).toBe("cancelled");
  });
});

describe("état de ma réponse", () => {
  it("à faire, répondue, puis verrouillée ou manquée à la clôture", () => {
    expect(answerState(question(), now)).toBe("todo");
    expect(answerState(question({ myAnswer: "oui" }), now)).toBe("answered");
    expect(answerState(question({ myAnswer: "oui", closesAt: at(-1) }), now)).toBe("locked");
    expect(answerState(question({ closesAt: at(-1) }), now)).toBe("missed");
  });

  it("gagnée ou perdue une fois résolue, annulée sans perte", () => {
    const resolved = { status: "resolved" as const, correctOptionId: "oui", closesAt: at(-60) };
    expect(answerState(question({ ...resolved, myAnswer: "oui" }), now)).toBe("won");
    expect(answerState(question({ ...resolved, myAnswer: "non" }), now)).toBe("lost");
    expect(answerState(question({ ...resolved }), now)).toBe("missed");
    expect(answerState(question({ status: "cancelled", myAnswer: "oui" }), now)).toBe("cancelled");
  });
});

describe("progression et points", () => {
  const list = [
    question({ id: "a", myAnswer: "oui" }),
    question({ id: "b" }),
    question({ id: "fermee", closesAt: at(-1), myAnswer: "oui" }),
    question({
      id: "gagnee",
      status: "resolved",
      correctOptionId: "oui",
      myAnswer: "oui",
      points: 15,
    }),
    question({ id: "annulee", status: "cancelled", myAnswer: "oui", points: 50 }),
  ];

  it("ne compte que les questions encore ouvertes", () => {
    expect(progress(list, now)).toEqual({ answered: 1, total: 2 });
  });

  it("additionne les points des questions gagnées, jamais des annulées", () => {
    expect(pointsWon(list, now)).toBe(15);
  });

  it("trie : ouvertes par clôture, puis fermées, résolues et annulées", () => {
    const sorted = sortQuestions(
      [
        question({ id: "annulee", status: "cancelled" }),
        question({ id: "tard", closesAt: at(60) }),
        question({ id: "resolue", status: "resolved" }),
        question({ id: "tot", closesAt: at(5) }),
        question({ id: "fermee", closesAt: at(-5) }),
      ],
      now,
    );
    expect(sorted.map((q) => q.id)).toEqual(["tot", "tard", "fermee", "resolue", "annulee"]);
  });
});

describe("affichage", () => {
  it("points avec l'espace des milliers et part du public", () => {
    expect(formatPoints(1240)).toBe("1 240 pts");
    const closed = question({ distribution: [{ optionId: "oui", percent: 64 }] });
    expect(optionPercent(closed, "oui")).toBe(64);
    expect(optionPercent(closed, "non")).toBeNull();
    expect(optionPercent(question(), "oui")).toBeNull();
  });
});
