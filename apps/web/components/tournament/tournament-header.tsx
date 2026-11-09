import type { TournamentDetail } from "@lislestart/shared";
import {
  dateRangeParts,
  formatSummary,
  locationLabel,
  participantCountLabel,
  sourceLabel,
} from "@/lib/tournament/format";

/**
 * En-tête du tournoi (maquette 5:51). Dans le DOM, le titre vient en premier ; la ligne
 * « Tournoi interne · FPS 5v5 · Présentiel » est remontée au-dessus visuellement (order-first).
 * Le côté droit reste libre pour la fermeture des pronostics (issue séparée).
 */
export function TournamentHeader({ detail }: { detail: TournamentDetail }) {
  const [start, end] = dateRangeParts(detail.startsAt, detail.endsAt);
  return (
    <header className="flex flex-col gap-2">
      <h1 className="type-display-l break-words text-fg sm:type-display-xl">{detail.name}</h1>

      <dl className="order-first flex flex-wrap gap-x-2 type-overline text-fg-muted">
        <dt className="sr-only">Type</dt>
        <dd>{sourceLabel(detail.source)}</dd>
        <dt className="sr-only">Jeu</dt>
        <dd>
          <span aria-hidden="true">· </span>
          {detail.game}
        </dd>
        <dt className="sr-only">Lieu</dt>
        <dd>
          <span aria-hidden="true">· </span>
          {locationLabel(detail.location)}
        </dd>
      </dl>

      <dl className="flex flex-wrap gap-x-4.5 gap-y-1 type-body-m text-fg-secondary">
        <dt className="sr-only">Dates</dt>
        <dd>
          <time dateTime={detail.startsAt}>{start}</time>
          {end && (
            <>
              {" – "}
              <time dateTime={detail.endsAt}>{end}</time>
            </>
          )}
        </dd>
        <dt className="sr-only">Participants</dt>
        <dd>{participantCountLabel(detail.participantCount, detail.participantMode)}</dd>
        <dt className="sr-only">Format</dt>
        <dd>{formatSummary(detail)}</dd>
      </dl>
    </header>
  );
}
