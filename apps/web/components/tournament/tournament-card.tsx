import type { TournamentSummary } from "@lislestart/shared";
import Link from "next/link";
import { TintedIcon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { plural } from "@/lib/plural";
import { formatDateRange, locationLabel, type TournamentStatus } from "@/lib/tournament/format";

const STATUS = {
  live: { label: "En direct", chip: "bg-lime-soft text-lime-text" },
  upcoming: { label: "À venir", chip: "bg-violet-soft text-violet-text" },
  done: { label: "Terminé", chip: "bg-raised text-fg-muted" },
} as const;

/** Carte de tournoi de la maquette (TournamentCard) : lien vers la page publique, statut écrit. */
export function TournamentCard({
  tournament,
  status,
}: {
  tournament: TournamentSummary;
  status: TournamentStatus;
}) {
  const source =
    tournament.source === "startgg"
      ? "Importé de start.gg"
      : `Interne · ${locationLabel(tournament.location).toLowerCase()}`;
  return (
    <Link
      href={`/tournois/${tournament.id}`}
      className={cx(
        "flex h-full flex-col gap-3.5 rounded-card bg-surface px-5 py-4.5 hover:bg-raised",
        status === "live" ? "border-2 border-lime" : "border border-line",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex size-11 items-center justify-center rounded-control bg-raised text-fg-secondary">
          <TintedIcon name="gamepad" size={24} />
        </span>
        <span
          className={cx(
            "flex items-center gap-1.5 rounded-full py-1 pr-3 pl-2.5 type-caption",
            STATUS[status].chip,
          )}
        >
          {status === "live" ? (
            <span aria-hidden="true" className="size-2 rounded-full bg-live" />
          ) : (
            <TintedIcon name={status === "upcoming" ? "clock" : "check"} size={14} />
          )}
          {STATUS[status].label}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="type-headline break-words text-fg">{tournament.name}</h3>
        <p className="type-body-s text-fg-muted">
          {tournament.game} · {plural(tournament.participantCount, "inscrit")}
        </p>
      </div>
      <hr className="mt-auto border-line" />
      <div className="flex items-center gap-2 type-caption">
        <span className="flex-1 text-fg-muted">{source}</span>
        <span className="text-fg-secondary">
          {formatDateRange(tournament.startsAt, tournament.endsAt)}
        </span>
        <TintedIcon name="chevron-right" size={16} className="text-fg-secondary" />
      </div>
    </Link>
  );
}
