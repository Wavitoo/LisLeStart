import { describe, expect, it } from "vitest";
import {
  dateRangeParts,
  formatDay,
  formatSummary,
  formatTime,
  matchName,
  tournamentStatus,
} from "./format";

describe("dates à l'heure du tournoi", () => {
  it("période sur un même mois, sur deux mois, sur deux années, sur un jour", () => {
    expect(dateRangeParts("2026-12-13T18:00:00+01:00", "2026-12-15T18:00:00+01:00")).toEqual([
      "13",
      "15 décembre",
    ]);
    expect(dateRangeParts("2026-11-30T10:00:00+01:00", "2026-12-02T10:00:00+01:00")).toEqual([
      "30 novembre",
      "2 décembre",
    ]);
    expect(dateRangeParts("2026-12-31T10:00:00+01:00", "2027-01-02T10:00:00+01:00")).toEqual([
      "31 décembre 2026",
      "2 janvier 2027",
    ]);
    expect(dateRangeParts("2027-01-09T14:00:00+01:00", "2027-01-09T19:00:00+01:00")).toEqual([
      "9 janvier",
    ]);
  });

  it("heure et jour en Europe/Paris, quel que soit le fuseau du serveur", () => {
    expect(formatTime("2026-12-14T20:30:00Z")).toBe("21:30");
    expect(formatDay("2026-12-13T23:30:00Z")).toBe("Lundi 14 décembre");
  });
});

describe("libellés", () => {
  it("format du tournoi comme dans la maquette", () => {
    expect(
      formatSummary({
        stages: [{ id: "s", name: "", format: "double_elimination" }],
        finalBestOf: 5,
      }),
    ).toBe("Élimination double, puis finale BO5");
    expect(formatSummary({ stages: [], finalBestOf: null })).toBe("Format à venir");
  });

  it("nom d'un match selon son tour", () => {
    const round = (label: string, count: number) => ({
      round: 1,
      label,
      matches: Array.from({ length: count }, (_, i) => ({
        id: `${i}`,
        number: i + 1,
        bestOf: 3,
        status: "scheduled" as const,
        scheduledAt: null,
        slots: [],
        winnerId: null,
      })),
    });
    const quarts = round("Quarts de finale", 4);
    expect(matchName(quarts, quarts.matches[2]!)).toBe("Quart de finale 3");
    const finale = round("Finale", 1);
    expect(matchName(finale, finale.matches[0]!)).toBe("Finale");
    const losers = round("Repêchage tour 1", 2);
    expect(matchName(losers, losers.matches[1]!)).toBe("Repêchage tour 1 · match 2");
  });
});

describe("statut d'un tournoi", () => {
  it("à venir, en direct (bornes comprises), terminé", () => {
    const t = { startsAt: "2026-12-13T18:00:00Z", endsAt: "2026-12-15T18:00:00Z" };
    expect(tournamentStatus(t, Date.parse("2026-12-13T17:59:59Z"))).toBe("upcoming");
    expect(tournamentStatus(t, Date.parse("2026-12-13T18:00:00Z"))).toBe("live");
    expect(tournamentStatus(t, Date.parse("2026-12-15T18:00:00Z"))).toBe("live");
    expect(tournamentStatus(t, Date.parse("2026-12-15T18:00:01Z"))).toBe("done");
  });
});
