import type { BracketMatch, BracketRound, BracketStage } from "@lislestart/shared";
import { Chip } from "@/components/ui/chip";
import { Heading, nextLevel, type HeadingLevel } from "@/components/ui/heading";
import {
  describeMatch,
  formatTime,
  MATCH_STATUS_LABELS,
  roundsBySide,
  SIDE_LABELS,
} from "@/lib/tournament/format";
import { ScrollRegion } from "./section";
import { TeamSlot, type SlotOutcome } from "./team-slot";

function outcomeOf(match: BracketMatch, participantId: string | null): SlotOutcome {
  if (!match.winnerId || !participantId) return "none";
  return participantId === match.winnerId ? "winner" : "loser";
}

function MatchStatus({ match }: { match: BracketMatch }) {
  if (match.status === "live") return <Chip variant="live">{MATCH_STATUS_LABELS.live}</Chip>;
  if (match.status === "scheduled") {
    return (
      <span className="type-body-s text-fg-secondary">
        {MATCH_STATUS_LABELS.scheduled}
        {match.scheduledAt && (
          <>
            {" · "}
            <time dateTime={match.scheduledAt} className="type-mono-s">
              {formatTime(match.scheduledAt)}
            </time>
          </>
        )}
      </span>
    );
  }
  return <span className="type-body-s text-fg-secondary">{MATCH_STATUS_LABELS[match.status]}</span>;
}

/**
 * Un match : un groupe dont le nom accessible se lit en entier (« Quart de finale 1 : Les Hiboux 2,
 * Brise-Glace 0, Les Hiboux gagne »). Le rendu visuel est masqué aux lecteurs d'écran pour ne pas
 * lire deux fois la même information. Il ne contient rien de focalisable.
 */
function BracketMatchCard({ round, match }: { round: BracketRound; match: BracketMatch }) {
  return (
    <li>
      <div role="group" aria-label={describeMatch(round, match)} data-match-id={match.id}>
        <div aria-hidden="true" className="flex flex-col gap-1.5">
          <div className="flex min-h-8 items-center justify-between gap-2">
            <MatchStatus match={match} />
            <span className="type-body-s text-fg-muted">BO{match.bestOf}</span>
          </div>
          {match.slots.map((slot, index) => (
            <TeamSlot key={index} slot={slot} outcome={outcomeOf(match, slot.participantId)} />
          ))}
        </div>
      </div>
    </li>
  );
}

function Rounds({ rounds, level }: { rounds: BracketRound[]; level: HeadingLevel }) {
  return (
    <div className="flex min-w-max gap-6">
      {rounds.map((round) => (
        <div key={`${round.side ?? ""}-${round.round}`} className="flex w-56 flex-col gap-4">
          <Heading level={level} className="type-overline text-fg-muted">
            {round.label}
          </Heading>
          {/* Les tours suivants se centrent entre les matchs qui les alimentent, comme sur la maquette */}
          <ol className="flex flex-1 flex-col justify-around gap-5">
            {round.matches.map((match) => (
              <BracketMatchCard key={match.id} round={round} match={match} />
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

/**
 * Arbre d'une étape. Élimination simple : un titre par tour au niveau `level`.
 * Élimination double : un titre par partie (tableau principal, repêchage, grande finale) au niveau
 * `level`, puis un titre par tour au niveau suivant.
 */
export function Bracket({ stage, level }: { stage: BracketStage; level: HeadingLevel }) {
  const sides = roundsBySide(stage.rounds);
  const hasSides = sides.some((group) => group.side !== null);

  if (!hasSides) {
    return (
      <ScrollRegion label={`Arbre ${stage.name}, défilement horizontal`}>
        <Rounds rounds={stage.rounds} level={level} />
      </ScrollRegion>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {sides.map((group) => {
        const title = group.side ? SIDE_LABELS[group.side] : stage.name;
        return (
          <div key={group.side ?? "main"} className="flex flex-col gap-4">
            <Heading level={level} className="type-heading text-fg">
              {title}
            </Heading>
            <ScrollRegion label={`${title}, défilement horizontal`}>
              <Rounds rounds={group.rounds} level={nextLevel(level)} />
            </ScrollRegion>
          </div>
        );
      })}
    </div>
  );
}
