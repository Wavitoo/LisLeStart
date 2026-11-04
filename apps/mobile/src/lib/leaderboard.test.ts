import type { LeaderboardResponse } from "@lislestart/shared";
import { describe, expect, it } from "vitest";
import { inviteMessage, isInTop, positionLabel } from "./leaderboard";

const entry = (rank: number, userId: string) => ({
  rank,
  userId,
  displayName: userId,
  points: 100,
});

function board(me: LeaderboardResponse["me"], participantCount = 13): LeaderboardResponse {
  return {
    scope: "global",
    title: "Général",
    entries: [entry(1, "a"), entry(2, "b"), entry(3, "moi")],
    me,
    participantCount,
  };
}

describe("classement", () => {
  it("sait si l'utilisateur est dans le haut du classement", () => {
    expect(isInTop(board(entry(3, "moi")))).toBe(true);
    expect(isInTop(board(entry(42, "loin")))).toBe(false);
    expect(isInTop(board(null))).toBe(false);
  });

  it("écrit la position en toutes lettres", () => {
    expect(positionLabel(board(entry(3, "moi")))).toBe("3e sur 13 pronostiqueurs");
    expect(positionLabel(board(entry(1, "moi"), 1240))).toBe("1er sur 1 240 pronostiqueurs");
    expect(positionLabel(board(entry(1, "moi"), 1))).toBe("1er sur 1 pronostiqueur");
  });

  it("invite avec le nom du groupe et son code", () => {
    const message = inviteMessage({
      id: "g",
      name: "Les potes du jeudi",
      memberCount: 5,
      inviteCode: "JEUDI-7Q2",
    });
    expect(message).toContain("« Les potes du jeudi »");
    expect(message).toContain("JEUDI-7Q2");
  });
});
