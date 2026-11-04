import type { FriendGroup, LeaderboardResponse } from "@lislestart/shared";
import { formatCount } from "./predictions";

/** L'utilisateur est déjà dans le haut du classement affiché. */
export function isInTop(board: LeaderboardResponse): boolean {
  return board.me !== null && board.entries.some((e) => e.userId === board.me?.userId);
}

/** « 3e sur 13 pronostiqueurs », « 1er sur 1 240 pronostiqueurs ». */
export function positionLabel(board: LeaderboardResponse): string {
  if (!board.me) return "";
  const rank = board.me.rank === 1 ? "1er" : `${board.me.rank}e`;
  const count = board.participantCount;
  return `${rank} sur ${formatCount(count)} pronostiqueur${count > 1 ? "s" : ""}`;
}

/** Message partagé pour inviter des amis dans un groupe (aucun lien de marque tierce). */
export function inviteMessage(group: FriendGroup): string {
  return `Rejoins mon groupe « ${group.name} » sur Seedline pour comparer nos pronos. Code d'invitation : ${group.inviteCode}`;
}
