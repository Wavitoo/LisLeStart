import type {
  Badge,
  FriendGroup,
  LeaderboardEntry,
  LeaderboardResponse,
  LeaderboardScope,
  PickemQuestionView,
} from "@lislestart/shared";

const MINUTE = 60_000;

/** Questions Pick'em fictives, une par modèle, placées autour de `origin`. */
export function mockPickemQuestions(origin: Date): PickemQuestionView[] {
  const at = (minutes: number) => new Date(origin.getTime() + minutes * MINUTE).toISOString();
  const options = (...labels: [string, string][]) => labels.map(([id, label]) => ({ id, label }));
  const base = {
    tournamentId: "mock-coupe-hiver",
    tournamentName: "Coupe d'hiver",
    myAnswer: null,
    correctOptionId: null,
    cancelReason: null,
    distribution: null,
  };
  return [
    {
      ...base,
      id: "q-vainqueur",
      template: "ranking",
      title: "Qui remporte la Coupe d'hiver ?",
      status: "open",
      closesAt: at(60),
      points: 20,
      options: options(
        ["hiboux", "Les Hiboux"],
        ["kraken", "Kraken Club"],
        ["renards", "Les Renards"],
        ["nova", "Team Nova"],
      ),
      answerCount: 640,
    },
    {
      ...base,
      id: "q-finale-3-0",
      template: "yes_no",
      title: "Un 3 – 0 en finale ?",
      status: "open",
      closesAt: at(90),
      points: 10,
      options: options(["oui", "Oui"], ["non", "Non"]),
      answerCount: 410,
    },
    {
      ...base,
      id: "q-carte",
      template: "most_picked",
      title: "Carte la plus jouée en demi-finales ?",
      status: "locked",
      closesAt: at(-25),
      points: 15,
      options: options(
        ["utopia", "Champions Field"],
        ["neo-tokyo", "Neo Tokyo"],
        ["salty", "Salty Shores"],
      ),
      distribution: [
        { optionId: "utopia", percent: 46 },
        { optionId: "neo-tokyo", percent: 31 },
        { optionId: "salty", percent: 23 },
      ],
      answerCount: 702,
    },
    {
      ...base,
      id: "q-manches",
      template: "total",
      title: "Combien de quarts de finale vont en manche décisive ?",
      status: "resolved",
      closesAt: at(-120),
      points: 15,
      options: options(["o-0", "0"], ["o-1", "1"], ["o-2", "2"], ["o-3", "3 ou plus"]),
      correctOptionId: "o-1",
      distribution: [
        { optionId: "o-0", percent: 12 },
        { optionId: "o-1", percent: 38 },
        { optionId: "o-2", percent: 34 },
        { optionId: "o-3", percent: 16 },
      ],
      answerCount: 820,
    },
    {
      ...base,
      id: "q-buts",
      template: "best_on_stat",
      title: "Qui marque le plus de buts en quarts de finale ?",
      status: "cancelled",
      closesAt: at(-120),
      points: 15,
      options: options(["p-lea", "Léa (Les Hiboux)"], ["p-sam", "Sam (Kraken Club)"]),
      cancelReason: "La statistique « buts » n'a pas été relevée en quarts. Aucun point perdu.",
      answerCount: 500,
    },
    {
      ...base,
      id: "q-babyfoot-top2",
      tournamentId: "mock-ligue-babyfoot",
      tournamentName: "Ligue babyfoot du jeudi",
      template: "yes_no",
      title: "Gamelle FC termine dans le top 2 ?",
      status: "open",
      closesAt: at(40),
      points: 10,
      options: options(["oui", "Oui"], ["non", "Non"]),
      answerCount: 95,
    },
  ];
}

/** Réponses du compte de démo : une question fermée, une résolue (juste), une annulée. */
export const DEMO_PICKEM_ANSWERS: [string, string][] = [
  ["q-carte", "neo-tokyo"],
  ["q-manches", "o-1"],
  ["q-buts", "p-lea"],
];

/** Pronostiqueurs fictifs (aucune donnée réelle), avec leurs points au classement général. */
const PLAYERS: [string, number][] = [
  ["renard_bleu", 1240],
  ["Mila.K", 1185],
  ["Pacôme", 1098],
  ["nova_fan", 1042],
  ["kraken.lover", 990],
  ["babyfoot_king", 951],
  ["LaPetiteGamelle", 903],
  ["tilt_proof", 880],
  ["hibou_hibou", 845],
  ["seed_hunter", 802],
  ["quart_de_finale", 760],
  ["bo3_only", 731],
];

export const DEMO_POINTS = 1120;

const TOURNAMENTS: Record<string, string> = {
  "mock-coupe-hiver": "Coupe d'hiver",
  "mock-ligue-babyfoot": "Ligue babyfoot du jeudi",
  "mock-open-echecs": "Open d'échecs en ligne",
};

export const DEMO_GROUPS: FriendGroup[] = [
  { id: "g-jeudi", name: "Les potes du jeudi", memberCount: 5, inviteCode: "JEUDI-7Q2" },
  { id: "g-bureau", name: "Ligue du bureau", memberCount: 9, inviteCode: "BUREAU-K8F" },
];

/** Membres fictifs de chaque groupe, en plus de l'utilisateur. */
const GROUP_MEMBERS: Record<string, string[]> = {
  "g-jeudi": ["Mila.K", "babyfoot_king", "LaPetiteGamelle", "bo3_only"],
  "g-bureau": [
    "renard_bleu",
    "Pacôme",
    "nova_fan",
    "kraken.lover",
    "tilt_proof",
    "hibou_hibou",
    "seed_hunter",
    "quart_de_finale",
  ],
};

export const DEMO_BADGES: Badge[] = [
  {
    id: "b-premier",
    name: "Premier prono",
    description: "Tu as fait ton tout premier pronostic.",
    earnedAt: "2026-11-02T18:00:00.000Z",
  },
  {
    id: "b-exact",
    name: "Score exact",
    description: "Tu as trouvé le score exact d'un match.",
    earnedAt: "2026-11-09T20:30:00.000Z",
  },
  {
    id: "b-flair",
    name: "Flair",
    description: "Trois pronos justes d'affilée.",
    earnedAt: "2026-11-12T21:10:00.000Z",
  },
];

const TOP = 10;

/**
 * Classement fictif : général, par tournoi (points réduits selon le tournoi) ou par groupe
 * (seulement ses membres). L'utilisateur y figure avec ses points ; `null` si inconnu.
 */
export function mockLeaderboard(
  scope: LeaderboardScope,
  id: string | undefined,
  me: { userId: string; displayName: string; points: number } | null,
): LeaderboardResponse | null {
  let title = "Général";
  let players = PLAYERS;
  let factor = 1;

  if (scope === "tournament") {
    const name = id ? TOURNAMENTS[id] : undefined;
    if (!name) return null;
    title = name;
    factor = id === "mock-coupe-hiver" ? 0.45 : 0.2;
  } else if (scope === "group") {
    const group = DEMO_GROUPS.find((g) => g.id === id);
    const members = id ? GROUP_MEMBERS[id] : undefined;
    if (!group || !members) return null;
    title = group.name;
    players = PLAYERS.filter(([name]) => members.includes(name));
  }

  const rows = players.map(([displayName, points]) => ({
    userId: `mock-${displayName}`,
    displayName,
    points: Math.round(points * factor),
  }));
  if (me) rows.push({ ...me, points: Math.round(me.points * factor) });
  rows.sort((a, b) => b.points - a.points || a.displayName.localeCompare(b.displayName));
  const ranked: LeaderboardEntry[] = rows.map((row, i) => ({ ...row, rank: i + 1 }));

  return {
    scope,
    title,
    entries: ranked.slice(0, TOP),
    me: me ? (ranked.find((r) => r.userId === me.userId) ?? null) : null,
    participantCount: ranked.length,
  };
}
