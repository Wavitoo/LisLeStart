// @vitest-environment jsdom
import type { BracketStage, ScheduledMatch } from "@lislestart/shared";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { mockTournamentData, type MockTournament } from "@/lib/api/mock-tournaments";
import { describeMatch, matchName, slotLabel, winnerName } from "@/lib/tournament/format";
import { Bracket } from "./bracket";
import { BracketSection } from "./bracket-section";
import { BracketTable } from "./bracket-table";
import { ParticipantsSection } from "./participants-section";
import { ScheduleSection } from "./schedule-section";
import { SectionLoading, type SectionData } from "./section";
import { StandingsSection } from "./standings-section";
import { TournamentView } from "./tournament-view";

const data = mockTournamentData();
const get = (id: string): MockTournament => {
  const tournament = data[id];
  if (!tournament) throw new Error(id);
  return tournament;
};
const stageOf = (id: string): BracketStage => {
  const stage = get(id).bracket[0];
  if (!stage) throw new Error(id);
  return stage;
};

interface ViewOverrides {
  bracket?: SectionData<BracketStage[]>;
  schedule?: SectionData<ScheduledMatch[]>;
}

/** Même composition que la page, avec les données déjà chargées. */
function renderView(tournament: MockTournament, overrides: ViewOverrides = {}) {
  return render(
    <main>
      <TournamentView
        detail={tournament.detail}
        bracket={
          <BracketSection result={overrides.bracket ?? { ok: true, data: tournament.bracket }} />
        }
        participants={<ParticipantsSection result={{ ok: true, data: tournament.participants }} />}
        schedule={
          <ScheduleSection result={overrides.schedule ?? { ok: true, data: tournament.schedule }} />
        }
        standings={<StandingsSection result={{ ok: true, data: tournament.standings }} />}
      />
    </main>,
  );
}

const groupNames = () =>
  screen.getAllByRole("group").map((group) => group.getAttribute("aria-label"));

describe("Arbre à élimination simple (exempts, à déterminer)", () => {
  it("un titre par tour, une liste par tour, un match par élément de liste", () => {
    render(<Bracket stage={stageOf("open-echecs")} level={3} />);
    const headings = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(["Quarts de finale", "Demi-finales", "Finale"]);
    const lists = screen.getAllByRole("list");
    expect(lists.map((list) => within(list).getAllByRole("listitem").length)).toEqual([4, 2, 1]);
  });

  it("nomme chaque match en entier, exempts et emplacements à déterminer compris", () => {
    render(<Bracket stage={stageOf("open-echecs")} level={3} />);
    expect(groupNames()).toEqual([
      "Quart de finale 1 : Fou du Roi, exempt, Fou du Roi passe (exempt)",
      "Quart de finale 2 : Pion Passé, Cavalier 7, à venir, 14:00",
      "Quart de finale 3 : Dame Noire, Tour de Garde, à venir, 14:00",
      "Quart de finale 4 : Roque Long, exempt, Roque Long passe (exempt)",
      "Demi-finale 1 : Fou du Roi, Vainqueur quart 2, à venir, 15:30",
      "Demi-finale 2 : Vainqueur quart 3, Roque Long, à venir, 15:30",
      "Finale : Vainqueur demie 1, Vainqueur demie 2, à venir, 17:00",
    ]);
  });

  it("affiche « Exempt » et l'origine des emplacements à déterminer", () => {
    const { container } = render(<Bracket stage={stageOf("open-echecs")} level={3} />);
    const byes = container.querySelectorAll('[data-slot-kind="bye"]');
    expect([...byes].map((slot) => slot.textContent)).toEqual(["Exempt", "Exempt"]);
    const tbd = container.querySelectorAll('[data-slot-kind="tbd"]');
    expect([...tbd].map((slot) => slot.textContent)).toContain("Vainqueur quart 2");
  });

  it("la zone de défilement est focalisable et nommée", () => {
    render(<Bracket stage={stageOf("open-echecs")} level={3} />);
    const region = screen.getByRole("region", { name: "Arbre Tableau, défilement horizontal" });
    expect(region).toHaveAttribute("tabindex", "0");
  });
});

describe("Arbre à élimination double", () => {
  it("un titre par partie (h3) puis par tour (h4), sans niveau sauté", () => {
    render(<Bracket stage={stageOf("coupe-hiver")} level={3} />);
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Tableau principal",
      "Repêchage",
      "Grande finale",
    ]);
    expect(screen.getAllByRole("heading", { level: 4 }).map((h) => h.textContent)).toEqual([
      "Quarts de finale",
      "Demi-finales",
      "Finale du tableau principal",
      "Repêchage tour 1",
      "Repêchage tour 2",
      "Repêchage tour 3",
      "Finale du repêchage",
      "Grande finale",
    ]);
  });

  it("vainqueur, match en direct, match à venir et à déterminer, lisibles sans la couleur", () => {
    const { container } = render(<Bracket stage={stageOf("coupe-hiver")} level={3} />);
    expect(
      screen.getByRole("group", {
        name: "Quart de finale 1 : Les Hiboux 2, Brise-Glace 0, Les Hiboux gagne",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Demi-finale 1 : Les Hiboux 1, Kraken Club 0, en cours" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", {
        name: "Repêchage tour 2 · match 1 : Vainqueur repêchage 1, Perdant demie 2, à venir",
      }),
    ).toBeInTheDocument();
    // Visuellement : ✓ devant le score du vainqueur, chip « En direct »
    const winner = container.querySelector('[data-match-id="ch-q1"] [data-outcome="winner"]');
    expect(winner).toHaveTextContent("Les Hiboux✓2");
    expect(container.querySelector('[data-match-id="ch-s1"]')).toHaveTextContent("En direct");
  });
});

describe("Vue liste équivalente", () => {
  for (const id of ["open-echecs", "coupe-hiver"]) {
    it(`${id} : mêmes matchs, mêmes participants, scores, vainqueurs et états`, () => {
      const stage = stageOf(id);
      const tree = render(<Bracket stage={stage} level={3} />);
      const treeIds = [...tree.container.querySelectorAll("[data-match-id]")].map((el) =>
        el.getAttribute("data-match-id"),
      );
      tree.unmount();

      render(<BracketTable stage={stage} level={3} />);
      const rows = screen.getAllByRole("row").filter((row) => row.hasAttribute("data-match-id"));
      expect(rows.map((row) => row.getAttribute("data-match-id"))).toEqual(treeIds);

      for (const round of stage.rounds) {
        for (const match of round.matches) {
          const row = rows.find(
            (candidate) => candidate.getAttribute("data-match-id") === match.id,
          );
          if (!row) throw new Error(match.id);
          expect(within(row).getByRole("rowheader")).toHaveTextContent(matchName(round, match));
          for (const slot of match.slots) expect(row).toHaveTextContent(slotLabel(slot));
          const winner = winnerName(match);
          if (winner) expect(row).toHaveTextContent(winner);
          // Toute l'information du nom accessible de l'arbre se retrouve dans la ligne
          expect(describeMatch(round, match)).toContain(matchName(round, match));
        }
      }
    });
  }

  it("chaque tableau a une légende et des en-têtes de colonne", () => {
    render(<BracketTable stage={stageOf("open-echecs")} level={3} />);
    const tables = screen.getAllByRole("table");
    expect(tables.map((table) => table.querySelector("caption")?.textContent)).toEqual([
      "Quarts de finale",
      "Demi-finales",
      "Finale",
    ]);
    for (const table of tables) {
      expect(
        within(table)
          .getAllByRole("columnheader")
          .map((th) => th.textContent),
      ).toEqual(["Match", "Participant 1", "Participant 2", "Score", "Vainqueur", "État"]);
    }
  });

  it("la bascule Vue arbre / Vue liste fonctionne au clavier (flèches)", async () => {
    const user = userEvent.setup();
    renderView(get("open-echecs"));
    const treeTab = screen.getByRole("tab", { name: "Vue arbre" });
    expect(treeTab).toHaveAttribute("aria-selected", "true");
    treeTab.focus();
    await user.keyboard("{ArrowRight}");
    const listTab = screen.getByRole("tab", { name: "Vue liste (équivalente)" });
    expect(listTab).toHaveFocus();
    expect(listTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByRole("table", { name: /finale/i }).length).toBeGreaterThan(0);
  });
});

describe("États vides et erreurs", () => {
  it("tournoi sans données : un message par section", () => {
    renderView(get("ligue-babyfoot"));
    expect(
      screen.getByText("L'arbre sera publié à la clôture des inscriptions."),
    ).toBeInTheDocument();
    expect(screen.getByText("Aucun participant inscrit pour l'instant.")).toBeInTheDocument();
    expect(
      screen.getByText("Le planning sera publié avant le début du tournoi."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Le classement apparaîtra après les premiers résultats."),
    ).toBeInTheDocument();
  });

  it("une section en erreur n'empêche pas les autres de s'afficher", () => {
    renderView(get("coupe-hiver"), { schedule: { ok: false }, bracket: { ok: false } });
    expect(screen.getByText(/Impossible de charger le planning/)).toBeInTheDocument();
    expect(screen.getByText(/Impossible de charger l'arbre/)).toBeInTheDocument();
    const participants = screen.getByRole("region", { name: "Participants" });
    expect(within(participants).getByRole("rowheader", { name: "Les Hiboux" })).toBeInTheDocument();
  });

  it("étape sans arbre (poules seules) : renvoie au classement", () => {
    const pools = get("coupe-hiver");
    renderView(pools, {
      bracket: { ok: true, data: [{ id: "p", name: "Poules", format: "round_robin", rounds: [] }] },
    });
    expect(screen.getByRole("link", { name: "classement" })).toHaveAttribute("href", "#classement");
  });
});

describe("Chargement", () => {
  it("une section en chargement garde son titre et l'annonce", () => {
    render(<SectionLoading id="planning" title="Planning" what="du planning" />);
    expect(screen.getByRole("heading", { level: 2, name: "Planning" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Chargement du planning…");
  });
});

describe("Structure de la page", () => {
  /** Titres dans l'ordre du document : un h1, puis aucun niveau sauté. */
  function outline() {
    return [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")].map((heading) => ({
      level: Number(heading.tagName.slice(1)),
      text: heading.textContent ?? "",
    }));
  }

  for (const id of ["coupe-hiver", "open-echecs", "ligue-babyfoot"]) {
    it(`${id} : un seul h1, un h2 par section, aucun niveau sauté`, () => {
      renderView(get(id));
      const headings = outline();
      expect(headings.filter((h) => h.level === 1).map((h) => h.text)).toEqual([
        get(id).detail.name,
      ]);
      expect(headings.filter((h) => h.level === 2).map((h) => h.text)).toEqual([
        "Arbre",
        "Participants",
        "Planning",
        "Classement",
      ]);
      expect(headings[0]?.level).toBe(1);
      headings.forEach((heading, index) => {
        const previous = headings[index - 1];
        if (previous) expect(heading.level - previous.level).toBeLessThanOrEqual(1);
      });
    });
  }

  it("chaque section est une région nommée par son h2, atteignable depuis la navigation interne", () => {
    renderView(get("coupe-hiver"));
    const nav = screen.getByRole("navigation", { name: "Sections du tournoi" });
    for (const [label, id] of [
      ["Arbre", "arbre"],
      ["Participants", "participants"],
      ["Planning", "planning"],
      ["Classement", "classement"],
    ] as const) {
      expect(within(nav).getByRole("link", { name: label })).toHaveAttribute("href", `#${id}`);
      expect(screen.getByRole("region", { name: label })).toHaveAttribute("id", id);
    }
  });

  it("dates dans <time datetime> et métadonnées en liste de définitions", () => {
    const { container } = renderView(get("coupe-hiver"));
    const times = [...container.querySelectorAll("header time")];
    expect(times.map((time) => [time.getAttribute("datetime"), time.textContent])).toEqual([
      ["2026-12-13T18:00:00+01:00", "13"],
      ["2026-12-15T18:00:00+01:00", "15 décembre"],
    ]);
    const terms = [...container.querySelectorAll("header dt")].map((dt) => dt.textContent);
    expect(terms).toEqual(["Type", "Jeu", "Lieu", "Dates", "Participants", "Format"]);
    expect(container.querySelector("header")).toHaveTextContent(
      "Poules, puis élimination double, puis finale BO5",
    );
  });
});
