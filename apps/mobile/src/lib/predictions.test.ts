import type { PredictionMatch } from "@lislestart/shared";
import { describe, expect, it } from "vitest";
import {
  applyMatchUpdate,
  draftFrom,
  featuredMatches,
  formatCount,
  formatScore,
  isLocked,
  myPredictions,
  predictionLabel,
  missedScore,
  predictionOutcome,
  predictionState,
  scoreOptions,
  submitButton,
  toPredictionInput,
} from "./predictions";

const now = new Date("2026-11-14T15:00:00Z");
const at = (min: number) => new Date(now.getTime() + min * 60_000).toISOString();

function match(overrides: Partial<PredictionMatch> = {}): PredictionMatch {
  return {
    id: "m1",
    tournamentId: "t1",
    tournamentName: "Coupe d'hiver",
    roundLabel: "Demi 1",
    bestOf: 3,
    status: "scheduled",
    locksAt: at(10),
    slots: [
      { participantId: "a", name: "Les Hiboux", score: null },
      { participantId: "b", name: "Kraken Club", score: null },
    ],
    myPrediction: null,
    distribution: null,
    predictionCount: 0,
    ...overrides,
  };
}

describe("verrouillage", () => {
  it("ouvert avant l'heure de verrouillage", () => {
    expect(isLocked(match(), now)).toBe(false);
  });

  it("fermé à l'heure exacte du début", () => {
    expect(isLocked(match({ locksAt: at(0) }), now)).toBe(true);
  });

  it("fermé dès que le match est lancé, même si l'heure prévue n'est pas passée", () => {
    expect(isLocked(match({ status: "live" }), now)).toBe(true);
  });

  it("ouvert sans heure de verrouillage tant que le match n'a pas commencé", () => {
    expect(isLocked(match({ locksAt: null }), now)).toBe(false);
  });
});

describe("matchs mis en avant", () => {
  it("prend le match en direct et le prochain qui se ferme le plus tôt", () => {
    const live = match({ id: "live", status: "live", locksAt: at(-20) });
    const later = match({ id: "later", locksAt: at(60) });
    const soon = match({ id: "soon", locksAt: at(5) });
    const { current, next } = featuredMatches([later, live, soon], now);
    expect(current?.id).toBe("live");
    expect(next?.id).toBe("soon");
  });

  it("ignore les matchs fermés et ceux dont un participant est à déterminer", () => {
    const closed = match({ id: "closed", locksAt: at(-1) });
    const tbd = match({
      id: "tbd",
      slots: [
        { participantId: "a", name: "Les Hiboux", score: null },
        { participantId: null, name: null, score: null },
      ],
    });
    expect(featuredMatches([closed, tbd], now).next).toBeNull();
  });

  it("montre le dernier résultat quand plus aucun match n'est en direct", () => {
    expect(featuredMatches([match({ id: "fini", status: "done" })], now).current?.id).toBe("fini");
  });
});

describe("score exact", () => {
  it("aucun choix en BO1, le score se déduit du vainqueur", () => {
    expect(scoreOptions(1)).toEqual([]);
  });

  it("BO3 et BO5 vus du vainqueur", () => {
    expect(scoreOptions(3)).toEqual([
      [2, 0],
      [2, 1],
    ]);
    expect(scoreOptions(5)).toEqual([
      [3, 0],
      [3, 1],
      [3, 2],
    ]);
  });

  it("remet le score dans l'ordre des emplacements selon le vainqueur", () => {
    const m = match();
    expect(toPredictionInput(m, { winnerId: "a", score: [2, 1] })).toEqual({
      winnerId: "a",
      score: [2, 1],
    });
    expect(toPredictionInput(m, { winnerId: "b", score: [2, 1] })).toEqual({
      winnerId: "b",
      score: [1, 2],
    });
  });

  it("ignore le score en BO1 et refuse un vainqueur absent du match", () => {
    expect(toPredictionInput(match({ bestOf: 1 }), { winnerId: "a", score: [2, 1] })).toEqual({
      winnerId: "a",
      score: null,
    });
    expect(toPredictionInput(match(), { winnerId: "z", score: null })).toBeNull();
  });

  it("préremplit le formulaire avec le prono enregistré, vu du vainqueur", () => {
    const m = match({ myPrediction: { winnerId: "b", score: [1, 2] } });
    expect(draftFrom(m)).toEqual({ winnerId: "b", score: [2, 1] });
  });
});

describe("bouton de validation", () => {
  const open = { locked: false, saving: false, signedIn: true };

  it("dit pourquoi il est désactivé", () => {
    const m = match();
    expect(submitButton(m, { winnerId: null, score: null }, open)).toEqual({
      label: "Choisis un vainqueur",
      disabled: true,
      action: "submit",
    });
    expect(
      submitButton(
        m,
        { winnerId: "a", score: null },
        { locked: true, saving: false, signedIn: true },
      ),
    ).toEqual({ label: "Prono fermé", disabled: true, action: "submit" });
  });

  it("valide un premier prono, puis propose de le modifier seulement s'il change", () => {
    expect(submitButton(match(), { winnerId: "a", score: null }, open).label).toBe(
      "Valider mon prono",
    );
    const saved = match({ myPrediction: { winnerId: "a", score: [2, 1] } });
    expect(submitButton(saved, draftFrom(saved), open)).toEqual({
      label: "Prono enregistré",
      disabled: true,
      action: "submit",
    });
    expect(submitButton(saved, { winnerId: "a", score: [2, 0] }, open)).toEqual({
      label: "Modifier mon prono",
      disabled: false,
      action: "submit",
    });
  });

  it("sans compte, mène à la connexion tant que le prono est ouvert", () => {
    const anonymous = { locked: false, saving: false, signedIn: false };
    expect(submitButton(match(), { winnerId: "a", score: null }, anonymous)).toEqual({
      label: "Se connecter pour pronostiquer",
      disabled: false,
      action: "signIn",
    });
    expect(
      submitButton(match(), { winnerId: null, score: null }, { ...anonymous, locked: true }).label,
    ).toBe("Prono fermé");
  });
});

describe("résultat et temps réel", () => {
  const live = match({
    status: "live",
    slots: [
      { participantId: "a", name: "Les Hiboux", score: 1 },
      { participantId: "b", name: "Kraken Club", score: 1 },
    ],
    myPrediction: { winnerId: "a", score: [2, 1] },
  });

  it("applique un score reçu en direct au bon match seulement", () => {
    const other = match({ id: "m2" });
    const [updated, untouched] = applyMatchUpdate([live, other], {
      tournamentId: "t1",
      matchId: "m1",
      status: "done",
      slots: [
        { participantId: "b", score: 1 },
        { participantId: "a", score: 2 },
      ],
      winnerId: "a",
      updatedAt: now.toISOString(),
    });
    expect(updated?.status).toBe("done");
    expect(updated?.slots.map((s) => s.score)).toEqual([2, 1]);
    expect(untouched).toBe(other);
  });

  it("prono juste ou faux une fois le match terminé, rien avant", () => {
    expect(predictionOutcome(live)).toBeNull();
    const won = (score: [number, number]) =>
      match({
        status: "done",
        myPrediction: live.myPrediction,
        slots: [
          { participantId: "a", name: "Les Hiboux", score: score[0] },
          { participantId: "b", name: "Kraken Club", score: score[1] },
        ],
      });
    expect(predictionOutcome(won([2, 1]))).toBe("exact");
    expect(predictionOutcome(won([2, 0]))).toBe("right");
    expect(predictionOutcome(won([0, 2]))).toBe("wrong");
    expect(missedScore(won([2, 0]))).toBe("2 – 0");
    expect(missedScore(won([2, 1]))).toBeNull();
  });

  it("décrit le prono avec le score du vainqueur en premier", () => {
    expect(predictionLabel(match({ myPrediction: { winnerId: "b", score: [1, 2] } }))).toBe(
      "Kraken Club, 2 – 1",
    );
    expect(predictionLabel(match({ myPrediction: { winnerId: "a", score: null } }))).toBe(
      "Les Hiboux",
    );
  });
});

describe("mes pronos", () => {
  const mine = { winnerId: "a", score: null };
  const done = (a: number, b: number) => ({
    status: "done" as const,
    slots: [
      { participantId: "a", name: "Les Hiboux", score: a },
      { participantId: "b", name: "Kraken Club", score: b },
    ],
  });

  it("donne l'état de chaque prono, du modifiable au résultat", () => {
    expect(predictionState(match(), now)).toBeNull();
    expect(predictionState(match({ myPrediction: mine }), now)).toBe("open");
    expect(predictionState(match({ myPrediction: mine, status: "live" }), now)).toBe("locked");
    expect(predictionState(match({ myPrediction: mine, ...done(2, 0) }), now)).toBe("right");
    const exactScore = { winnerId: "a", score: [2, 0] as [number, number] };
    expect(predictionState(match({ myPrediction: exactScore, ...done(2, 0) }), now)).toBe("exact");
    expect(predictionState(match({ myPrediction: mine, ...done(1, 2) }), now)).toBe("wrong");
  });

  it("liste tous mes pronos, à venir d'abord puis par fermeture", () => {
    const list = [
      match({ id: "fini", myPrediction: mine, ...done(2, 0) }),
      match({ id: "sans-prono" }),
      match({ id: "ouvert-tard", myPrediction: mine, locksAt: at(30) }),
      match({ id: "ouvert-tot", myPrediction: mine, locksAt: at(5) }),
      match({ id: "en-cours", myPrediction: mine, status: "live" }),
    ];
    expect(myPredictions(list, now).map((m) => m.id)).toEqual([
      "ouvert-tot",
      "ouvert-tard",
      "en-cours",
      "fini",
    ]);
  });

  it("le dernier résultat est le match terminé le plus récent", () => {
    const early = match({ id: "tot", locksAt: at(-60), ...done(2, 0) });
    const late = match({ id: "tard", locksAt: at(-5), ...done(0, 2) });
    expect(featuredMatches([early, late], now).current?.id).toBe("tard");
  });
});

describe("formats de la charte", () => {
  it("tiret demi-cadratin et milliers séparés", () => {
    expect(formatScore(3, 1)).toBe("3 – 1");
    expect(formatCount(1384)).toBe("1 384");
    expect(formatCount(912)).toBe("912");
  });
});
