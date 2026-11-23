import Link from "next/link";
import { PageMain } from "@/components/site/page-main";
import { SiteHeader } from "@/components/site/site-header";
import { formatCountdown } from "@/lib/countdown";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <PageMain>
        <div className="flex flex-col items-start gap-4">
          <h1 className="type-display-l text-fg">Seedline</h1>
          <p className="type-body-m text-fg">
            Organise tes tournois, importe ceux de la communauté et pronostique en direct.
          </p>
          <p className="type-body-m text-fg-muted">
            Exemple : pronostics fermés dans {formatCountdown(2 * 3600 + 14 * 60)}.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/tournois"
              className="inline-flex h-12 items-center rounded-control bg-lime px-5.5 type-label text-on-accent"
            >
              Voir les tournois
            </Link>
            <Link
              href="/admin/tournois/nouveau"
              className="inline-flex h-12 items-center rounded-control border-2 border-line-strong px-5.5 type-label text-fg"
            >
              Créer un tournoi
            </Link>
          </div>
        </div>
      </PageMain>
    </>
  );
}
