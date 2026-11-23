import type {
  BracketMatch,
  BracketRound,
  BracketSlot,
  BracketStage,
  CheckInStatus,
  MatchStatus,
  ScheduledMatch,
  StageStandings,
  StandingRow,
  TournamentDetail,
  TournamentParticipant,
  TournamentParticipantsResponse,
} from "@lislestart/shared";

/*
 * Tournois fictifs pour développer la page publique sans l'API. Équipes et pseudos inventés,
 * cohérents avec la maquette (Coupe d'hiver, quarts Les Hiboux – Brise-Glace…).
 */

export interface MockTournament {
  detail: TournamentDetail;
  bracket: BracketStage[];
  participants: TournamentParticipantsResponse;
  schedule: ScheduledMatch[];
  standings: StageStandings[];
}

type Team = { id: string; name: string; seed: number };

const slot = (team: Team, score: number | null = null): BracketSlot => ({
  participantId: team.id,
  name: team.name,
  seed: team.seed,
  score,
  isBye: false,
});
const tbd = (placeholder: string): BracketSlot => ({
  participantId: null,
  name: null,
  seed: null,
  score: null,
  isBye: false,
  placeholder,
});
const bye = (): BracketSlot => ({
  participantId: null,
  name: null,
  seed: null,
  score: null,
  isBye: true,
});

function match(
  id: string,
  number: number,
  status: MatchStatus,
  slots: BracketSlot[],
  options: { bestOf?: number; at?: string; station?: string } = {},
): BracketMatch {
  let winnerId: string | null = null;
  if (status === "done") {
    const [a, b] = slots;
    if (a && b) {
      if (b.isBye) winnerId = a.participantId;
      else if (a.isBye) winnerId = b.participantId;
      else if (a.score !== null && b.score !== null) {
        winnerId = a.score > b.score ? a.participantId : b.participantId;
      }
    }
  }
  return {
    id,
    number,
    bestOf: options.bestOf ?? 3,
    status,
    scheduledAt: options.at ?? null,
    slots,
    winnerId,
    station: options.station ?? null,
  };
}

/** Matchs de l'arbre qui ont un horaire, au format du planning. */
function scheduleFrom(stage: BracketStage, roundName: (round: BracketRound) => string) {
  return stage.rounds.flatMap((round) =>
    round.matches
      .filter((m) => m.scheduledAt)
      .map((m): ScheduledMatch => ({
        id: m.id,
        stageName: stage.name,
        roundLabel: round.matches.length > 1 ? `${roundName(round)} ${m.number}` : roundName(round),
        scheduledAt: m.scheduledAt ?? "",
        station: m.station ?? null,
        status: m.status,
        slots: m.slots.map((s) => ({
          participantId: s.participantId,
          name: s.name,
          score: s.score,
          placeholder: s.placeholder ?? null,
        })),
        winnerId: m.winnerId,
      })),
  );
}

const SHORT_ROUND: Record<string, string> = {
  "Quarts de finale": "Quart",
  "Demi-finales": "Demie",
};

// --- Coupe d'hiver : 16 équipes, poules puis élimination double (finale BO5) ---

function coupeHiver(): MockTournament {
  const names = [
    "Les Hiboux",
    "Kraken Club",
    "Team Orage",
    "Pixel Fury",
    "Échec et Mat",
    "Les Grizzlis",
    "Nova 5",
    "Brise-Glace",
    "Les Renards",
    "Lynx Rouge",
    "Code Rouge",
    "Les Mouettes",
    "Zénith",
    "Polaris",
    "Atlas",
    "Les Castors",
  ];
  const teams: Team[] = names.map((name, index) => ({
    id: `team-${index + 1}`,
    name,
    seed: index + 1,
  }));
  const t = (name: string) => {
    const team = teams.find((candidate) => candidate.name === name);
    if (!team) throw new Error(`équipe inconnue : ${name}`);
    return team;
  };
  const day = (date: string, time: string) => `${date}T${time}:00+01:00`;

  const winners: BracketRound[] = [
    {
      round: 1,
      side: "winners",
      label: "Quarts de finale",
      matches: [
        match("ch-q1", 1, "done", [slot(t("Les Hiboux"), 2), slot(t("Brise-Glace"), 0)], {
          at: day("2026-12-14", "18:00"),
          station: "Poste 1",
        }),
        match("ch-q2", 2, "done", [slot(t("Kraken Club"), 2), slot(t("Nova 5"), 1)], {
          at: day("2026-12-14", "18:00"),
          station: "Poste 2",
        }),
        match("ch-q3", 3, "done", [slot(t("Team Orage"), 2), slot(t("Les Grizzlis"), 1)], {
          at: day("2026-12-14", "20:05"),
          station: "Poste 3",
        }),
        match("ch-q4", 4, "done", [slot(t("Pixel Fury"), 2), slot(t("Échec et Mat"), 0)], {
          at: day("2026-12-14", "20:40"),
          station: "Poste 4",
        }),
      ],
    },
    {
      round: 2,
      side: "winners",
      label: "Demi-finales",
      matches: [
        match("ch-s1", 1, "live", [slot(t("Les Hiboux"), 1), slot(t("Kraken Club"), 0)], {
          at: day("2026-12-14", "21:00"),
          station: "Poste 1",
        }),
        match("ch-s2", 2, "scheduled", [slot(t("Team Orage")), slot(t("Pixel Fury"))], {
          at: day("2026-12-14", "21:30"),
          station: "Poste 4",
        }),
      ],
    },
    {
      round: 3,
      side: "winners",
      label: "Finale du tableau principal",
      matches: [
        match("ch-wf", 1, "scheduled", [tbd("Vainqueur demie 1"), tbd("Vainqueur demie 2")]),
      ],
    },
  ];

  const losers: BracketRound[] = [
    {
      round: 1,
      side: "losers",
      label: "Repêchage tour 1",
      matches: [
        match("ch-l1", 1, "scheduled", [slot(t("Brise-Glace")), slot(t("Nova 5"))], {
          at: day("2026-12-14", "22:15"),
          station: "Poste 2",
        }),
        match("ch-l2", 2, "scheduled", [slot(t("Les Grizzlis")), slot(t("Échec et Mat"))], {
          at: day("2026-12-14", "22:15"),
          station: "Poste 3",
        }),
      ],
    },
    {
      round: 2,
      side: "losers",
      label: "Repêchage tour 2",
      matches: [
        match("ch-l3", 1, "scheduled", [tbd("Vainqueur repêchage 1"), tbd("Perdant demie 2")]),
        match("ch-l4", 2, "scheduled", [tbd("Vainqueur repêchage 2"), tbd("Perdant demie 1")]),
      ],
    },
    {
      round: 3,
      side: "losers",
      label: "Repêchage tour 3",
      matches: [
        match("ch-l5", 1, "scheduled", [
          tbd("Vainqueur repêchage 3"),
          tbd("Vainqueur repêchage 4"),
        ]),
      ],
    },
    {
      round: 4,
      side: "losers",
      label: "Finale du repêchage",
      matches: [
        match("ch-l6", 1, "scheduled", [
          tbd("Vainqueur repêchage 5"),
          tbd("Perdant finale du tableau"),
        ]),
      ],
    },
  ];

  const grandFinal: BracketRound[] = [
    {
      round: 1,
      side: "grand_final",
      label: "Grande finale",
      matches: [
        match(
          "ch-gf",
          1,
          "scheduled",
          [tbd("Vainqueur du tableau principal"), tbd("Vainqueur du repêchage")],
          { bestOf: 5, at: day("2026-12-15", "17:00"), station: "Scène" },
        ),
      ],
    },
  ];

  const finale: BracketStage = {
    id: "ch-stage-2",
    name: "Phase finale",
    format: "double_elimination",
    rounds: [...winners, ...losers, ...grandFinal],
  };

  // Poules : 4 poules de 4, victoire 3 pts, nul 1 pt
  const groups = [0, 1, 2, 3].map((g) => {
    const members = [teams[g], teams[7 - g], teams[8 + g], teams[15 - g]].filter(
      (team): team is Team => team !== undefined,
    );
    const records = [
      [3, 0, 0],
      [2, 0, 1],
      [1, 0, 2],
      [0, 0, 3],
    ];
    const rows: StandingRow[] = members.map((team, index) => {
      const [wins = 0, draws = 0, losses = 0] = records[index] ?? [];
      return {
        rank: index + 1,
        participantId: team.id,
        name: team.name,
        wins,
        losses,
        draws,
        points: wins * 3 + draws,
      };
    });
    const letter = String.fromCharCode(65 + g);
    return { id: `ch-group-${letter}`, name: `Poule ${letter}`, rows };
  });

  const scheduledPools: ScheduledMatch[] = groups.slice(0, 2).map((group, index) => {
    const [a, b] = group.rows;
    return {
      id: `ch-pool-${index}`,
      stageName: "Poules",
      roundLabel: `${group.name} · tour 3`,
      scheduledAt: day("2026-12-13", index === 0 ? "18:00" : "18:45"),
      station: `Poste ${index + 1}`,
      status: "done",
      slots: [
        { participantId: a?.participantId ?? null, name: a?.name ?? null, score: 2 },
        { participantId: b?.participantId ?? null, name: b?.name ?? null, score: 1 },
      ],
      winnerId: a?.participantId ?? null,
    };
  });

  const roundName = (round: BracketRound) =>
    SHORT_ROUND[round.label] ?? (round.side === "losers" ? "Repêchage" : round.label);

  const checkIn: CheckInStatus = "checked_in";
  return {
    detail: {
      id: "coupe-hiver",
      name: "Coupe d'hiver",
      game: "FPS 5v5",
      source: "internal",
      location: "onsite",
      startsAt: day("2026-12-13", "18:00"),
      endsAt: day("2026-12-15", "18:00"),
      participantCount: 16,
      participantMode: "team",
      capacity: 16,
      description: null,
      stages: [
        { id: "ch-stage-1", name: "Poules", format: "round_robin" },
        { id: "ch-stage-2", name: "Phase finale", format: "double_elimination" },
      ],
      finalBestOf: 5,
    },
    bracket: [finale],
    participants: {
      participantMode: "team",
      participants: teams.map((team, index): TournamentParticipant => ({
        id: team.id,
        name: team.name,
        seed: team.seed,
        rosterSize: 5 + (index % 3),
        checkIn,
      })),
    },
    schedule: [...scheduledPools, ...scheduleFrom(finale, roundName)],
    standings: [{ stageId: "ch-stage-1", stageName: "Poules", format: "round_robin", groups }],
  };
}

// --- Open d'échecs : 6 joueurs, élimination simple avec exempts, pas encore commencé ---

function openEchecs(): MockTournament {
  const players: Team[] = [
    "Fou du Roi",
    "Roque Long",
    "Dame Noire",
    "Pion Passé",
    "Cavalier 7",
    "Tour de Garde",
  ].map((name, index) => ({ id: `player-${index + 1}`, name, seed: index + 1 }));
  const [p1, p2, p3, p4, p5, p6] = players as [Team, Team, Team, Team, Team, Team];
  const at = (time: string) => `2027-01-09T${time}:00+01:00`;

  const stage: BracketStage = {
    id: "oe-stage-1",
    name: "Tableau",
    format: "single_elimination",
    rounds: [
      {
        round: 1,
        label: "Quarts de finale",
        matches: [
          match("oe-q1", 1, "done", [slot(p1), bye()], { bestOf: 1 }),
          match("oe-q2", 2, "scheduled", [slot(p4), slot(p5)], {
            bestOf: 1,
            at: at("14:00"),
            station: "Table 1",
          }),
          match("oe-q3", 3, "scheduled", [slot(p3), slot(p6)], {
            bestOf: 1,
            at: at("14:00"),
            station: "Table 2",
          }),
          match("oe-q4", 4, "done", [slot(p2), bye()], { bestOf: 1 }),
        ],
      },
      {
        round: 2,
        label: "Demi-finales",
        matches: [
          match("oe-s1", 1, "scheduled", [slot(p1), tbd("Vainqueur quart 2")], {
            bestOf: 1,
            at: at("15:30"),
            station: "Table 1",
          }),
          match("oe-s2", 2, "scheduled", [tbd("Vainqueur quart 3"), slot(p2)], {
            bestOf: 1,
            at: at("15:30"),
            station: "Table 2",
          }),
        ],
      },
      {
        round: 3,
        label: "Finale",
        matches: [
          match("oe-f", 1, "scheduled", [tbd("Vainqueur demie 1"), tbd("Vainqueur demie 2")], {
            bestOf: 3,
            at: at("17:00"),
            station: "Table 1",
          }),
        ],
      },
    ],
  };

  const checkIns: CheckInStatus[] = [
    "checked_in",
    "checked_in",
    "pending",
    "checked_in",
    "absent",
    "pending",
  ];
  return {
    detail: {
      id: "open-echecs",
      name: "Open d'échecs",
      game: "Échecs",
      source: "internal",
      location: "onsite",
      startsAt: at("14:00"),
      endsAt: at("19:00"),
      participantCount: 6,
      participantMode: "solo",
      capacity: 8,
      description: null,
      stages: [{ id: "oe-stage-1", name: "Tableau", format: "single_elimination" }],
      finalBestOf: 3,
    },
    bracket: [stage],
    participants: {
      participantMode: "solo",
      participants: players.map((player, index) => ({
        id: player.id,
        name: player.name,
        seed: player.seed,
        rosterSize: null,
        checkIn: checkIns[index] ?? "pending",
      })),
    },
    schedule: scheduleFrom(stage, (round) => SHORT_ROUND[round.label] ?? round.label),
    standings: [],
  };
}

// --- Ligue de babyfoot : inscriptions ouvertes, rien de publié ---

function ligueBabyfoot(): MockTournament {
  return {
    detail: {
      id: "ligue-babyfoot",
      name: "Ligue de babyfoot",
      game: "Babyfoot",
      source: "internal",
      location: "onsite",
      startsAt: "2027-02-06T10:00:00+01:00",
      endsAt: "2027-02-06T18:00:00+01:00",
      participantCount: 0,
      participantMode: "team",
      capacity: 12,
      description: null,
      stages: [],
      finalBestOf: null,
    },
    bracket: [],
    participants: { participantMode: "team", participants: [] },
    schedule: [],
    standings: [],
  };
}

export function mockTournamentData(): Record<string, MockTournament> {
  const all = [coupeHiver(), openEchecs(), ligueBabyfoot()];
  return Object.fromEntries(all.map((tournament) => [tournament.detail.id, tournament]));
}
