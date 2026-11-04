import type { LocationType, Source, TournamentSummary } from "@lislestart/shared";

/** Un tournoi est en cours entre son début et sa fin, sur l'horloge du serveur. */
export function isLive(tournament: TournamentSummary, serverNow: Date): boolean {
  const now = serverNow.getTime();
  return Date.parse(tournament.startsAt) <= now && now < Date.parse(tournament.endsAt);
}

/** Tournois en cours, du plus récemment commencé au plus ancien. */
export function liveTournaments(
  tournaments: readonly TournamentSummary[],
  serverNow: Date,
): TournamentSummary[] {
  return tournaments
    .filter((t) => isLive(t, serverNow))
    .sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt));
}

const LOCATIONS: Record<LocationType, string> = {
  online: "En ligne",
  onsite: "Sur place",
  mixed: "En ligne et sur place",
};

const SOURCES: Record<Source, string> = {
  internal: "Tournoi interne",
  file_import: "Tournoi importé",
  startgg: "Importé depuis start.gg",
};

export function locationLabel(location: LocationType): string {
  return LOCATIONS[location];
}

export function sourceLabel(source: Source): string {
  return SOURCES[source];
}

export function participantsLabel(count: number): string {
  return count <= 1 ? `${count} participant` : `${count} participants`;
}

/** Phrase complète lue par TalkBack pour une carte de tournoi. */
export function tournamentAccessibilityLabel(t: TournamentSummary): string {
  return [
    t.name,
    t.game,
    "en direct",
    locationLabel(t.location),
    participantsLabel(t.participantCount),
    sourceLabel(t.source),
  ].join(", ");
}
