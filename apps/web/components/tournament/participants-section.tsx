import type { CheckInStatus, TournamentParticipantsResponse } from "@lislestart/shared";
import { cx } from "@/lib/cx";
import { CHECK_IN_LABELS, participantCountLabel } from "@/lib/tournament/format";
import {
  EmptyState,
  ScrollRegion,
  SectionError,
  TournamentSection,
  type SectionData,
} from "./section";

const th = "px-3 py-2 text-left type-overline text-fg-muted";
const td = "border-t border-line px-3 py-3 type-body-m text-fg";

const CHECK_IN_STYLE: Record<CheckInStatus, { icon: string; className: string }> = {
  checked_in: { icon: "✓", className: "text-lime-text" },
  pending: { icon: "…", className: "text-fg-secondary" },
  absent: { icon: "✕", className: "text-alert-text" },
};

export function ParticipantsSection({
  result,
}: {
  result: SectionData<TournamentParticipantsResponse>;
}) {
  let content: React.ReactNode;
  if (!result.ok) {
    content = <SectionError what="les participants" />;
  } else if (result.data.participants.length === 0) {
    content = <EmptyState>Aucun participant inscrit pour l&apos;instant.</EmptyState>;
  } else {
    const { participants, participantMode } = result.data;
    const team = participantMode === "team";
    const sorted = [...participants].sort(
      (a, b) => (a.seed ?? Number.MAX_SAFE_INTEGER) - (b.seed ?? Number.MAX_SAFE_INTEGER),
    );
    content = (
      <ScrollRegion label="Tableau des participants, défilement horizontal">
        <table className="w-full border-collapse">
          <caption className="pb-2 text-left type-body-m text-fg-secondary">
            {participantCountLabel(participants.length, participantMode)}{" "}
            {team ? "inscrites" : "inscrits"}, par tête de série
          </caption>
          <thead>
            <tr>
              <th scope="col" className={th}>
                Tête de série
              </th>
              <th scope="col" className={th}>
                {team ? "Équipe" : "Joueur"}
              </th>
              {team && (
                <th scope="col" className={th}>
                  Joueurs
                </th>
              )}
              <th scope="col" className={th}>
                Check-in
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((participant) => {
              const style = CHECK_IN_STYLE[participant.checkIn];
              return (
                <tr key={participant.id}>
                  <td className={cx(td, "type-mono-s text-fg-secondary")}>
                    {participant.seed ?? "—"}
                  </td>
                  <th scope="row" className={cx(td, "text-left font-semibold")}>
                    {participant.name}
                  </th>
                  {team && (
                    <td className={cx(td, "type-mono-s")}>{participant.rosterSize ?? "—"}</td>
                  )}
                  <td className={cx(td, style.className)}>
                    <span aria-hidden="true">{style.icon} </span>
                    {CHECK_IN_LABELS[participant.checkIn]}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ScrollRegion>
    );
  }

  return <TournamentSection section="participants">{content}</TournamentSection>;
}
