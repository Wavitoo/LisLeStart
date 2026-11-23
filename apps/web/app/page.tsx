import Link from "next/link";
import { SiteShell } from "@/components/site/site-shell";
import { TournamentCard } from "@/components/tournament/tournament-card";
import { getCurrentUser, getPublicApi } from "@/lib/api/server";
import { plural } from "@/lib/plural";
import { TOURNAMENT_TIME_ZONE, tournamentStatus } from "@/lib/tournament/format";

export const dynamic = "force-dynamic";

const TODAY = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: TOURNAMENT_TIME_ZONE,
});

/**
 * Accueil (maquette « Accueil ») : salutation et tournois à suivre. Le résumé, les pronostics à
 * faire et les groupes viendront avec leurs API.
 */
export default async function HomePage() {
  const [user, tournaments] = await Promise.all([
    getCurrentUser(),
    getPublicApi()
      .list()
      .catch(() => []),
  ]);
  const now = Date.now();
  const withStatus = tournaments.map((tournament) => ({
    tournament,
    status: tournamentStatus(tournament, now),
  }));
  const liveCount = withStatus.filter((item) => item.status === "live").length;
  // En direct d'abord, puis à venir ; les tournois terminés ne sont plus « à suivre ».
  const toFollow = [
    ...withStatus.filter((item) => item.status === "live"),
    ...withStatus.filter((item) => item.status === "upcoming"),
  ].slice(0, 3);

  return (
    <SiteShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="type-overline text-fg-muted">
            {TODAY.format(now)} · {plural(liveCount, "tournoi")} en direct
          </p>
          <h1 className="type-display-xl break-words text-fg">
            {user ? `Bonjour, ${user.displayName}` : "Bienvenue sur Seedline"}
          </h1>
        </div>
        {!user && (
          <Link
            href="/inscription"
            className="inline-flex h-12 items-center rounded-control border-2 border-line-strong px-5.5 type-label text-fg"
          >
            Créer un compte
          </Link>
        )}
      </div>

      {!user && (
        <p className="max-w-2xl type-body-l text-fg-secondary">
          Suis les tournois de ta LAN ou de start.gg et pronostique en direct. Des points, des
          badges et des titres. Jamais d&apos;argent.
        </p>
      )}

      <section aria-labelledby="a-suivre" className="flex flex-col gap-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="a-suivre" className="type-display-s text-fg">
            Tournois à suivre
          </h2>
          <Link
            href="/tournois"
            className="inline-flex min-h-11 items-center type-label text-lime-text"
          >
            Tous les tournois
          </Link>
        </div>
        {toFollow.length === 0 ? (
          <p className="type-body-m text-fg-secondary">
            Aucun tournoi en direct ou à venir pour l&apos;instant.
          </p>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {toFollow.map(({ tournament, status }) => (
              <li key={tournament.id}>
                <TournamentCard tournament={tournament} status={status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </SiteShell>
  );
}
