import type { TournamentDetail } from "@lislestart/shared";
import Link from "next/link";
import { Icon, TintedIcon } from "@/components/ui/icon";
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
      <nav aria-label="Fil d'Ariane" className="order-first mb-4">
        <ol className="flex items-center gap-1.5 type-body-m">
          <li className="flex items-center gap-1.5">
            <Link href="/tournois" className="text-fg-muted underline-offset-2 hover:underline">
              Tournois
            </Link>
            <Icon name="chevron-right" size={14} />
          </li>
          <li aria-current="page" className="type-body-m-strong text-fg-secondary">
            {detail.name}
          </li>
        </ol>
      </nav>
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

      <dl className="flex flex-wrap gap-x-4.5 gap-y-1 type-body-m text-fg-secondary [&_dd]:flex [&_dd]:items-center [&_dd]:gap-1.5">
        <dt className="sr-only">Dates</dt>
        <dd>
          <TintedIcon name="calendar" size={16} className="text-fg-muted" />
          <time dateTime={detail.startsAt}>{start}</time>
          {end && (
            <>
              {" – "}
              <time dateTime={detail.endsAt}>{end}</time>
            </>
          )}
        </dd>
        <dt className="sr-only">Participants</dt>
        <dd>
          <TintedIcon name="users" size={16} className="text-fg-muted" />
          {participantCountLabel(detail.participantCount, detail.participantMode)}
        </dd>
        <dt className="sr-only">Format</dt>
        <dd>
          <TintedIcon name="bracket" size={16} className="text-fg-muted" />
          {formatSummary(detail)}
        </dd>
      </dl>
    </header>
  );
}
