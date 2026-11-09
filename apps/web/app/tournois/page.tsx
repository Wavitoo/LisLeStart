import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site/site-header";
import { SectionError } from "@/components/tournament/section";
import { getPublicApi } from "@/lib/api/server";
import { dateRangeParts, locationLabel } from "@/lib/tournament/format";

export const metadata: Metadata = { title: "Tournois · Seedline" };
export const dynamic = "force-dynamic";

/** Liste minimale des tournois publics, en attendant la page dessinée. */
export default async function TournamentsPage() {
  const tournaments = await getPublicApi()
    .list()
    .catch(() => null);

  return (
    <>
      <SiteHeader current="tournois" />
      <main
        id="contenu"
        tabIndex={-1}
        className="mx-auto flex max-w-7xl flex-col gap-7 px-4 pt-8 pb-16 sm:px-10 xl:px-20"
      >
        <h1 className="type-display-l text-fg">Tournois</h1>
        {tournaments === null ? (
          <SectionError what="les tournois" />
        ) : tournaments.length === 0 ? (
          <p className="type-body-m text-fg-secondary">Aucun tournoi public pour l&apos;instant.</p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tournaments.map((tournament) => {
              const [start, end] = dateRangeParts(tournament.startsAt, tournament.endsAt);
              return (
                <li key={tournament.id} className="flex flex-col gap-1 rounded-card bg-surface p-5">
                  <h2 className="type-display-s text-fg">
                    <Link
                      href={`/tournois/${tournament.id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {tournament.name}
                    </Link>
                  </h2>
                  <p className="type-overline text-fg-muted">
                    {tournament.game} · {locationLabel(tournament.location)}
                  </p>
                  <p className="type-body-m text-fg-secondary">
                    <time dateTime={tournament.startsAt}>{start}</time>
                    {end && (
                      <>
                        {" – "}
                        <time dateTime={tournament.endsAt}>{end}</time>
                      </>
                    )}
                    {" · "}
                    {tournament.participantCount} inscrit
                    {tournament.participantCount >= 2 ? "s" : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
