import type { TournamentDetail } from "@lislestart/shared";
import type { ReactNode } from "react";
import { SectionNav } from "./section-nav";
import { TournamentHeader } from "./tournament-header";
import { TournamentLayout } from "./tournament-layout";

export interface TournamentViewProps {
  detail: TournamentDetail;
  /** Les quatre sections, dans l'ordre de la navigation interne. */
  bracket: ReactNode;
  participants: ReactNode;
  schedule: ReactNode;
  standings: ReactNode;
}

/** Contenu de la page publique d'un tournoi, à placer dans <main>. */
export function TournamentView({
  detail,
  bracket,
  participants,
  schedule,
  standings,
}: TournamentViewProps) {
  return (
    <>
      <TournamentHeader detail={detail} />
      <SectionNav />
      <TournamentLayout>
        {bracket}
        {participants}
        {schedule}
        {standings}
      </TournamentLayout>
    </>
  );
}
