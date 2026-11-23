import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/site/site-shell";
import { SectionError } from "@/components/tournament/section";
import { TournamentCard } from "@/components/tournament/tournament-card";
import { getPublicApi } from "@/lib/api/server";
import { cx } from "@/lib/cx";
import { plural } from "@/lib/plural";
import { tournamentStatus, type TournamentStatus } from "@/lib/tournament/format";

export const metadata: Metadata = { title: "Tournois · Seedline" };
export const dynamic = "force-dynamic";

const GROUPS: { status: TournamentStatus; title: string; filter: string; param: string }[] = [
  { status: "live", title: "En direct", filter: "En direct", param: "direct" },
  { status: "upcoming", title: "À venir", filter: "À venir", param: "a-venir" },
  { status: "done", title: "Terminés récemment", filter: "Terminés", param: "termines" },
];

type Props = { searchParams: Promise<{ statut?: string | string[] }> };

/** Liste des tournois publics (maquette « Tournois — liste »), regroupés par statut. */
export default async function TournamentsPage({ searchParams }: Props) {
  const { statut } = await searchParams;
  const selected = GROUPS.find((group) => group.param === statut);
  const tournaments = await getPublicApi()
    .list()
    .catch(() => null);

  const now = Date.now();
  const byStatus = (status: TournamentStatus) =>
    (tournaments ?? []).filter((tournament) => tournamentStatus(tournament, now) === status);

  const filterClass = (current: boolean) =>
    cx(
      "flex h-11 items-center rounded-nav border px-4 type-body-m-strong",
      current
        ? "border-line-strong bg-raised text-fg shadow-md"
        : "border-transparent text-fg-muted hover:text-fg",
    );

  return (
    <SiteShell>
      <div className="flex flex-col gap-1">
        <h1 className="type-display-xl break-words text-fg">Tournois</h1>
        <p className="type-body-m text-fg-muted">
          Suis les tournois internes et ceux importés de start.gg. Tu peux pronostiquer sur tous.
        </p>
      </div>

      {tournaments === null ? (
        <SectionError what="les tournois" />
      ) : tournaments.length === 0 ? (
        <p className="type-body-m text-fg-secondary">Aucun tournoi public pour l&apos;instant.</p>
      ) : (
        <>
          <nav aria-label="Filtrer par statut">
            <ul className="flex w-fit flex-wrap gap-0.5 rounded-control bg-sidebar p-0.75">
              <li>
                <Link
                  href="/tournois"
                  aria-current={selected ? undefined : "page"}
                  className={filterClass(!selected)}
                >
                  Tous
                </Link>
              </li>
              {GROUPS.map((group) => (
                <li key={group.param}>
                  <Link
                    href={`/tournois?statut=${group.param}`}
                    aria-current={selected === group ? "page" : undefined}
                    className={filterClass(selected === group)}
                  >
                    {group.filter} · {byStatus(group.status).length}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {(selected ? [selected] : GROUPS).map((group) => {
            const items = byStatus(group.status);
            if (items.length === 0 && !selected) return null;
            return (
              <section
                key={group.status}
                aria-labelledby={`groupe-${group.param}`}
                className="flex flex-col gap-3.5"
              >
                <div className="flex items-baseline gap-2.5">
                  <h2 id={`groupe-${group.param}`} className="type-display-s text-fg">
                    {group.title}
                  </h2>
                  <p className="type-caption text-fg-muted">{plural(items.length, "tournoi")}</p>
                </div>
                {items.length === 0 ? (
                  <p className="type-body-m text-fg-secondary">
                    Aucun tournoi pour l&apos;instant.
                  </p>
                ) : (
                  <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((tournament) => (
                      <li key={tournament.id}>
                        <TournamentCard tournament={tournament} status={group.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </>
      )}
    </SiteShell>
  );
}
