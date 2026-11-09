import type { BracketMatch, BracketRound, BracketStage } from "@lislestart/shared";
import { Heading, type HeadingLevel } from "@/components/ui/heading";
import {
  formatTime,
  MATCH_STATUS_LABELS,
  matchName,
  roundsBySide,
  SIDE_LABELS,
  slotLabel,
  winnerName,
} from "@/lib/tournament/format";
import { ScrollRegion } from "./section";

const th = "px-3 py-2 text-left type-overline text-fg-muted";
const td = "border-t border-line px-3 py-2.5 align-top type-body-m text-fg";

function score(match: BracketMatch): string {
  const [a, b] = match.slots;
  if (!a || !b || a.score === null || b.score === null) return "—";
  return `${a.score} – ${b.score}`;
}

/** Vue liste d'un tour : mêmes matchs et mêmes informations que l'arbre, en tableau. */
function RoundTable({ round }: { round: BracketRound }) {
  return (
    <table className="w-full min-w-xl border-collapse" data-round={round.label}>
      <caption className="pb-2 text-left type-overline text-fg-muted">{round.label}</caption>
      <thead>
        <tr>
          <th scope="col" className={th}>
            Match
          </th>
          <th scope="col" className={th}>
            Participant 1
          </th>
          <th scope="col" className={th}>
            Participant 2
          </th>
          <th scope="col" className={th}>
            Score
          </th>
          <th scope="col" className={th}>
            Vainqueur
          </th>
          <th scope="col" className={th}>
            État
          </th>
        </tr>
      </thead>
      <tbody>
        {round.matches.map((match) => {
          const winner = winnerName(match);
          return (
            <tr key={match.id} data-match-id={match.id}>
              <th scope="row" className={`${td} text-left font-semibold`}>
                {matchName(round, match)}
              </th>
              {[0, 1].map((index) => {
                const slot = match.slots[index];
                return (
                  <td key={index} className={td}>
                    {slot ? slotLabel(slot) : "—"}
                  </td>
                );
              })}
              <td className={`${td} type-mono-s`}>{score(match)}</td>
              <td className={td}>
                {winner ? (
                  <>
                    <span aria-hidden="true" className="text-lime-text">
                      ✓{" "}
                    </span>
                    {winner}
                  </>
                ) : (
                  "—"
                )}
              </td>
              <td className={td}>
                {match.scheduledAt && match.status === "scheduled" ? (
                  <>
                    {MATCH_STATUS_LABELS.scheduled},{" "}
                    <time dateTime={match.scheduledAt}>{formatTime(match.scheduledAt)}</time>
                  </>
                ) : (
                  MATCH_STATUS_LABELS[match.status]
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Vue liste (équivalente) d'une étape : un tableau par tour, un titre par partie d'arbre. */
export function BracketTable({ stage, level }: { stage: BracketStage; level: HeadingLevel }) {
  const sides = roundsBySide(stage.rounds);
  return (
    <div className="flex flex-col gap-8">
      {sides.map((group) => {
        const title = group.side ? SIDE_LABELS[group.side] : null;
        return (
          <div key={group.side ?? "main"} className="flex flex-col gap-4">
            {title && (
              <Heading level={level} className="type-heading text-fg">
                {title}
              </Heading>
            )}
            <ScrollRegion label={`${title ?? `Arbre ${stage.name}`}, tableaux des matchs`}>
              <div className="flex flex-col gap-6">
                {group.rounds.map((round) => (
                  <RoundTable key={`${round.side ?? ""}-${round.round}`} round={round} />
                ))}
              </div>
            </ScrollRegion>
          </div>
        );
      })}
    </div>
  );
}
