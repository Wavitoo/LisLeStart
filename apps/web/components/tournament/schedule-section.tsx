import type { ScheduledMatch } from "@lislestart/shared";
import { Chip } from "@/components/ui/chip";
import { cx } from "@/lib/cx";
import { dayKey, formatDay, formatTime, MATCH_STATUS_LABELS } from "@/lib/tournament/format";
import {
  EmptyState,
  ScrollRegion,
  SectionError,
  TournamentSection,
  type SectionData,
} from "./section";

// Lignes de l'« Agenda » du dashboard (maquette 4:115), à l'échelle de la page.
const td = "border-t border-line py-3 pr-4 align-middle";

function name(slot: ScheduledMatch["slots"][number] | undefined) {
  return slot?.name ?? slot?.placeholder ?? "À déterminer";
}

/** « Pixel Fury 2 – 0 Échec et Mat » une fois joué, « Team Orage vs Pixel Fury » avant. */
function opposition(match: ScheduledMatch) {
  const [a, b] = match.slots;
  if (a?.score != null && b?.score != null) {
    return `${name(a)} ${a.score} – ${b.score} ${name(b)}`;
  }
  return `${name(a)} vs ${name(b)}`;
}

function Status({ match }: { match: ScheduledMatch }) {
  if (match.status === "live") return <Chip variant="live">{MATCH_STATUS_LABELS.live}</Chip>;
  const winner = match.slots.find(
    (slot) => slot.participantId && slot.participantId === match.winnerId,
  );
  return (
    <span className="type-body-m text-fg-secondary">
      {MATCH_STATUS_LABELS[match.status]}
      {winner?.name && <span className="sr-only">, {winner.name} gagne</span>}
    </span>
  );
}

export function ScheduleSection({ result }: { result: SectionData<ScheduledMatch[]> }) {
  let content: React.ReactNode;
  if (!result.ok) {
    content = <SectionError what="le planning" />;
  } else if (result.data.length === 0) {
    content = <EmptyState>Le planning sera publié avant le début du tournoi.</EmptyState>;
  } else {
    const days = new Map<string, ScheduledMatch[]>();
    for (const match of [...result.data].sort((a, b) =>
      a.scheduledAt.localeCompare(b.scheduledAt),
    )) {
      const key = dayKey(match.scheduledAt);
      const matches = days.get(key);
      if (matches) matches.push(match);
      else days.set(key, [match]);
    }
    content = (
      <div className="flex flex-col gap-6">
        {[...days].map(([key, matches]) => {
          const first = matches[0];
          if (!first) return null;
          const day = formatDay(first.scheduledAt);
          return (
            <div key={key} className="flex flex-col gap-2">
              <h3 className="type-heading text-fg">
                <time dateTime={key}>{day}</time>
              </h3>
              <ScrollRegion label={`Matchs du ${day.toLowerCase()}, défilement horizontal`}>
                <table className="w-full border-collapse">
                  <caption className="sr-only">Matchs du {day.toLowerCase()}</caption>
                  {/* En-têtes lus par les lecteurs d'écran ; visuellement, les lignes de l'Agenda */}
                  <thead className="sr-only">
                    <tr>
                      <th scope="col">Heure</th>
                      <th scope="col">Match</th>
                      <th scope="col">Tour et poste</th>
                      <th scope="col">État</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((match) => (
                      <tr key={match.id}>
                        <td className={cx(td, "w-20 type-mono-s text-fg-muted")}>
                          <time dateTime={match.scheduledAt}>{formatTime(match.scheduledAt)}</time>
                        </td>
                        <th scope="row" className={cx(td, "text-left type-body-m-strong text-fg")}>
                          {opposition(match)}
                        </th>
                        <td className={cx(td, "type-body-m text-fg-secondary")}>
                          {match.roundLabel}
                          {match.station && ` · ${match.station.toLowerCase()}`}
                        </td>
                        <td className={cx(td, "pr-0 text-right")}>
                          <Status match={match} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollRegion>
            </div>
          );
        })}
      </div>
    );
  }

  return <TournamentSection section="schedule">{content}</TournamentSection>;
}
