import { describe, expect, it } from "vitest";
import {
  byeCount,
  parsePlacementPoints,
  stageEntrants,
  tournamentFormSchema,
  type StageFormValues,
  type TournamentFormValues,
} from "./schema";
import { defaultStage, toCreateTournamentInput } from "./values";

/** Tournoi valide de la maquette : 16 places, poules de 4 puis double élimination. */
function valid(overrides: Partial<TournamentFormValues> = {}): TournamentFormValues {
  return {
    name: "Coupe d'hiver",
    gameId: "game-fps",
    startsAt: "2026-12-13T18:00",
    endsAt: "2026-12-15T18:00",
    location: "onsite",
    visibility: "public",
    description: "",
    rules: "",
    participantMode: "team",
    teamMin: 5,
    teamMax: 7,
    capacity: 16,
    registrationMode: "approval",
    waitlist: true,
    checkIn: true,
    customFields: [{ label: "Pseudo en jeu", required: true }],
    stages: [
      { ...defaultStage("round_robin"), startsOn: "2026-12-13" },
      { ...defaultStage("double_elimination"), startsOn: "2026-12-14" },
    ],
    ...overrides,
  };
}

function stage(format: StageFormValues["format"], overrides: Partial<StageFormValues> = {}) {
  return { ...defaultStage(format), ...overrides };
}

/** Messages d'erreur indexés par chemin (« stages.0.groupSize »). */
function errors(values: TournamentFormValues): Record<string, string> {
  const result = tournamentFormSchema.safeParse(values);
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join("."), issue.message]),
  );
}

describe("tournamentFormSchema : cas valide", () => {
  it("accepte le tournoi de la maquette", () => {
    expect(errors(valid())).toEqual({});
  });

  it("accepte un tournoi solo sans étape facultative remplie", () => {
    const values = valid({
      participantMode: "solo",
      teamMin: Number.NaN,
      teamMax: Number.NaN,
      capacity: 8,
      customFields: [],
      stages: [stage("single_elimination")],
    });
    expect(errors(values)).toEqual({});
  });

  it("produit le corps de POST /tournaments", () => {
    const input = toCreateTournamentInput(valid());
    expect(input.teamSize).toEqual({ min: 5, max: 7 });
    expect(input.checkInMinutes).toBe(30);
    expect(input.stages[0]).toMatchObject({
      format: "round_robin",
      startsOn: "2026-12-13",
      settings: {
        groupCount: 4,
        groupSize: 4,
        qualifiersPerGroup: 2,
        tiebreakers: ["head_to_head", "game_difference"],
      },
    });
    // dernière étape : pas de qualifiés
    expect(input.stages[1]).toMatchObject({
      format: "double_elimination",
      settings: { bestOf: 3, finalBestOf: 5 },
    });
    expect(new Date(input.startsAt).getTime()).toBe(new Date("2026-12-13T18:00").getTime());
  });
});

describe("tournamentFormSchema : informations générales", () => {
  it("nom vide", () => {
    expect(errors(valid({ name: "  " })).name).toBe(
      "Indique le nom du tournoi : par exemple « Coupe d'hiver ».",
    );
  });

  it("nom trop court", () => {
    expect(errors(valid({ name: "Ab" })).name).toBe(
      "Le nom est trop court (2 caractères) : utilise au moins 3 caractères.",
    );
  });

  it("nom trop long", () => {
    expect(errors(valid({ name: "x".repeat(81) })).name).toBe(
      "Le nom dépasse 80 caractères (81) : raccourcis-le.",
    );
  });

  it("jeu manquant", () => {
    expect(errors(valid({ gameId: "" })).gameId).toBe(
      "Choisis le jeu du tournoi dans la liste. S'il n'y est pas, déclare-le d'abord dans « Jeux et statistiques ».",
    );
  });

  it("dates manquantes", () => {
    const result = errors(valid({ startsAt: "", endsAt: "" }));
    expect(result.startsAt).toBe(
      "Indique la date et l'heure de début : par exemple 13/12/2026 18:00.",
    );
    expect(result.endsAt).toBe("Indique la date et l'heure de fin : par exemple 15/12/2026 18:00.");
  });

  it("dates incomplètes", () => {
    const result = errors(valid({ startsAt: "2026-12-13", endsAt: "2026-12" }));
    expect(result.startsAt).toBe(
      "La date de début est incomplète : indique le jour et l'heure (JJ/MM/AAAA HH:MM).",
    );
    expect(result.endsAt).toBe(
      "La date de fin est incomplète : indique le jour et l'heure (JJ/MM/AAAA HH:MM).",
    );
  });

  it("fin avant le début, avec la date à choisir", () => {
    expect(errors(valid({ endsAt: "2026-12-11T18:00" })).endsAt).toBe(
      "La date de fin précède la date de début : choisis une date après le 13/12/2026 à 18:00.",
    );
  });

  it("fin identique au début", () => {
    expect(
      errors(valid({ endsAt: "2026-12-13T18:00", stages: [stage("single_elimination")] })).endsAt,
    ).toBe(
      "La date de fin est identique à la date de début : choisis une date après le 13/12/2026 à 18:00.",
    );
  });

  it("description et règlement trop longs", () => {
    const result = errors(valid({ description: "x".repeat(2001), rules: "x".repeat(10001) }));
    expect(result.description).toBe(
      "La description dépasse 2\u202f000 caractères (2\u202f001) : raccourcis-la ou déplace le détail dans le règlement.",
    );
    expect(result.rules).toBe(
      "Le règlement dépasse 10\u202f000 caractères (10\u202f001) : raccourcis-le ou mets un lien vers un document complet.",
    );
  });
});

describe("tournamentFormSchema : participants et inscriptions", () => {
  it("taille d'équipe : min > max", () => {
    expect(errors(valid({ teamMin: 5, teamMax: 3 })).teamMax).toBe(
      "La taille max (3) est inférieure au nombre de titulaires (5) : indique au moins 5.",
    );
  });

  it("taille d'équipe : champs vides", () => {
    const result = errors(valid({ teamMin: Number.NaN, teamMax: Number.NaN }));
    expect(result.teamMin).toBe("Indique le nombre de titulaires par équipe : par exemple 5.");
    expect(result.teamMax).toBe(
      "Indique la taille max d'une équipe, remplaçants compris : par exemple 7.",
    );
  });

  it("taille d'équipe : moins de 2 titulaires, valeur décimale", () => {
    const result = errors(valid({ teamMin: 1, teamMax: 2.5 }));
    expect(result.teamMin).toBe(
      "Une équipe compte au moins 2 titulaires : indique 2 ou plus, ou passe le format en Solo.",
    );
    expect(result.teamMax).toBe("La taille max doit être un nombre entier : par exemple 7.");
  });

  it("en solo, les tailles d'équipe sont ignorées", () => {
    const result = errors(valid({ participantMode: "solo", teamMin: 5, teamMax: 1 }));
    expect(result.teamMax).toBeUndefined();
  });

  it("places vides", () => {
    expect(errors(valid({ capacity: Number.NaN })).capacity).toBe(
      "Indique le nombre de places : par exemple 16.",
    );
  });

  it("places à 0 ou négatives", () => {
    const message = "Le nombre de places doit être supérieur à 0 : indique au moins 2 places.";
    expect(errors(valid({ capacity: 0 })).capacity).toBe(message);
    expect(errors(valid({ capacity: -4 })).capacity).toBe(message);
  });

  it("une seule place, places décimales, trop de places", () => {
    const solo = { stages: [stage("single_elimination")] };
    expect(errors(valid({ ...solo, capacity: 1 })).capacity).toBe(
      "Un tournoi se joue à 2 participants au moins : indique au moins 2 places.",
    );
    expect(errors(valid({ ...solo, capacity: 8.5 })).capacity).toBe(
      "Le nombre de places doit être un nombre entier : par exemple 16.",
    );
    expect(errors(valid({ ...solo, capacity: 5000 })).capacity).toBe(
      "5\u202f000 places dépasse la limite : indique au plus 4\u202f096 places.",
    );
  });

  it("places qui ne remplissent pas les poules (message de la maquette)", () => {
    expect(errors(valid({ capacity: 18 })).capacity).toBe(
      "18 places ne remplissent pas 4 poules de 4 : mets 16 places ou ajoute une poule.",
    );
    expect(errors(valid({ capacity: 12 })).capacity).toBe(
      "12 places ne remplissent pas 4 poules de 4 : mets 16 places ou retire une poule.",
    );
  });

  it("trop de champs personnalisés", () => {
    const customFields = Array.from({ length: 11 }, (_, i) => ({
      label: `Champ ${i}`,
      required: false,
    }));
    expect(errors(valid({ customFields })).customFields).toBe(
      "11 champs personnalisés, c'est trop : garde-en 10 au plus.",
    );
  });
});

describe("tournamentFormSchema : étapes", () => {
  it("au moins une étape", () => {
    expect(errors(valid({ stages: [] })).stages).toBe(
      "Ajoute au moins une étape : clique sur « + Ajouter une étape » puis choisis son format.",
    );
  });

  it("jour d'étape hors des dates du tournoi", () => {
    const stages = [stage("single_elimination", { startsOn: "2026-12-20" })];
    expect(errors(valid({ stages, capacity: 16 }))["stages.0.startsOn"]).toBe(
      "Étape 1 : le 20/12/2026 est hors des dates du tournoi : choisis un jour entre le 13/12/2026 et le 15/12/2026.",
    );
  });

  it("étape qui commence avant la précédente", () => {
    const stages = [
      { ...defaultStage("round_robin"), startsOn: "2026-12-14" },
      { ...defaultStage("double_elimination"), startsOn: "2026-12-13" },
    ];
    expect(errors(valid({ stages }))["stages.1.startsOn"]).toBe(
      "Étape 2 : elle commence avant l'étape 1 (14/12/2026) : choisis le 14/12/2026 ou après.",
    );
  });

  it("finale plus courte que les tours", () => {
    const stages = [stage("single_elimination", { bestOf: 3, finalBestOf: 1 })];
    expect(errors(valid({ stages }))["stages.0.finalBestOf"]).toBe(
      "Étape 1 : la finale (BO1) est plus courte que les tours (BO3) : choisis BO3 ou plus pour la finale.",
    );
  });

  it("postes trop longs", () => {
    const stages = [stage("single_elimination", { stations: "x".repeat(41) })];
    expect(errors(valid({ stages }))["stages.0.stations"]).toBe(
      "Étape 1 : les postes dépassent 40 caractères : écris-les plus court, par exemple « 1 à 8 ».",
    );
  });

  it("arbre qui reçoit moins de 2 participants", () => {
    const stages = [stage("swiss", { qualifiers: 1 }), stage("single_elimination")];
    expect(errors(valid({ stages }))["stages.1.format"]).toBe(
      "Étape 2 : un arbre demande au moins 2 participants, il n'en reçoit que 1 : augmente les qualifiés de l'étape précédente.",
    );
  });

  it("poules : champs vides et hors limites", () => {
    const stages = [stage("round_robin", { groupCount: Number.NaN, groupSize: 1 })];
    const result = errors(valid({ stages }));
    expect(result["stages.0.groupCount"]).toBe(
      "Étape 1 : indique le nombre de poules : par exemple 4.",
    );
    expect(result["stages.0.groupSize"]).toBe(
      "Étape 1 : il faut au moins 2 pour la taille des poules : indique 2 ou plus.",
    );
  });

  it("poules : barème incohérent", () => {
    const winLoss = [stage("round_robin", { pointsWin: 0, pointsLoss: 0, pointsDraw: 0 })];
    expect(errors(valid({ stages: winLoss }))["stages.0.pointsWin"]).toBe(
      "Étape 1 : une victoire (0 pt) doit rapporter plus qu'une défaite (0 pt) : mets au moins 1 pour la victoire.",
    );
    const draw = [stage("round_robin", { pointsWin: 3, pointsDraw: 4, pointsLoss: 0 })];
    expect(errors(valid({ stages: draw }))["stages.0.pointsDraw"]).toBe(
      "Étape 1 : un nul (4 pts) doit valoir entre une défaite (0) et une victoire (3) : mets une valeur de 0 à 3.",
    );
  });

  it("poules : plus de qualifiés que de participants par poule", () => {
    const stages = [stage("round_robin", { qualifiers: 5 }), stage("single_elimination")];
    expect(errors(valid({ stages }))["stages.0.qualifiers"]).toBe(
      "Étape 1 : 5 qualifiés par poule, c'est plus que les 4 participants par poule : mets 4 qualifiés au plus.",
    );
  });

  it("poules en 2e étape qui ne correspondent pas aux qualifiés", () => {
    const stages = [
      stage("swiss", { qualifiers: 8 }),
      stage("round_robin", { groupCount: 3, groupSize: 4 }),
    ];
    expect(errors(valid({ stages }))["stages.1.groupCount"]).toBe(
      "Étape 2 : 8 qualifiés ne remplissent pas 3 poules de 4 : mets 2 poules de 4 ou modifie les qualifiés de l'étape 1.",
    );
  });

  it("départage inadapté au format", () => {
    const stages = [stage("swiss", { tiebreak: "head_to_head_games" })];
    expect(errors(valid({ stages }))["stages.0.tiebreak"]).toBe(
      "Étape 1 : choisis un départage adapté au format Ronde suisse : par exemple « Buchholz, confrontation directe ».",
    );
  });

  it("suisse : trop de rondes pour éviter les rematchs", () => {
    const stages = [stage("swiss", { rounds: 20 })];
    expect(errors(valid({ stages }))["stages.0.rounds"]).toBe(
      "Étape 1 : 20 rondes sans rematch demandent au moins 21 participants, il y en a 16 : mets 15 rondes au plus.",
    );
  });

  it("suisse : plus de qualifiés que de participants", () => {
    const stages = [stage("swiss", { qualifiers: 32 }), stage("single_elimination")];
    expect(errors(valid({ stages }))["stages.0.qualifiers"]).toBe(
      "Étape 1 : 32 qualifiés, c'est plus que les 16 participants : mets 16 qualifiés au plus.",
    );
  });

  it("dernière étape : les qualifiés sont ignorés", () => {
    const stages = [stage("swiss", { qualifiers: Number.NaN })];
    expect(errors(valid({ stages }))["stages.0.qualifiers"]).toBeUndefined();
  });

  it("FFA : points de placement invalides", () => {
    const at = (placementPoints: string, playersPerMatch = 8) =>
      errors(valid({ stages: [stage("free_for_all", { placementPoints, playersPerMatch })] }))[
        "stages.0.placementPoints"
      ];
    expect(at("10, 6, x")).toBe(
      "Étape 1 : « x » n'est pas un nombre entier : écris les points séparés par des virgules, par exemple 10, 6, 4, 2.",
    );
    expect(at(" ")).toBe(
      "Étape 1 : indique les points gagnés à chaque place : par exemple 10, 6, 4, 2.",
    );
    expect(at("4, 6, 10")).toBe(
      "Étape 1 : les points doivent baisser de la 1re à la dernière place : range-les du plus grand au plus petit, par exemple 10, 6, 4, 2.",
    );
    expect(at("5, 4, 3, 2", 3)).toBe(
      "Étape 1 : 4 valeurs pour 3 joueurs par partie : retire des valeurs ou augmente le nombre de joueurs.",
    );
  });

  it("FFA : joueurs par partie et parties", () => {
    const stages = [stage("free_for_all", { playersPerMatch: 2, matchCount: 2.5 })];
    const result = errors(valid({ stages }));
    expect(result["stages.0.playersPerMatch"]).toBe(
      "Étape 1 : il faut au moins 3 pour le nombre de joueurs par partie : indique 3 ou plus.",
    );
    expect(result["stages.0.matchCount"]).toBe(
      "Étape 1 : le nombre de parties doit être un nombre entier : par exemple 3.",
    );
  });

  it("signale toutes les erreurs en un seul passage (champs et règles croisées)", () => {
    const result = errors(
      valid({ name: "", capacity: Number.NaN, endsAt: "2026-12-01T10:00", teamMax: 2 }),
    );
    expect(Object.keys(result).sort()).toEqual(["capacity", "endsAt", "name", "teamMax"]);
  });
});

describe("calculs d'étapes", () => {
  it("participants par étape", () => {
    const values = valid();
    expect(stageEntrants(values)).toEqual([16, 8]);
  });

  it("exempts d'un arbre", () => {
    expect(byeCount(8)).toBe(0);
    expect(byeCount(12)).toBe(4);
    expect(byeCount(2)).toBe(0);
  });

  it("lecture des points de placement", () => {
    expect(parsePlacementPoints("10, 6 ; 4,2")).toEqual({ ok: true, points: [10, 6, 4, 2] });
    expect(parsePlacementPoints("10, -1")).toEqual({ ok: false, invalid: "-1" });
  });
});
