import Link from "next/link";
import { SiteHeader } from "@/components/site/site-header";

export default function TournamentNotFound() {
  return (
    <>
      <SiteHeader current="tournois" />
      <main
        id="contenu"
        tabIndex={-1}
        className="mx-auto flex max-w-xl flex-col items-start gap-4 px-4 py-16"
      >
        <h1 className="type-display-l text-fg">Tournoi introuvable</h1>
        <p className="type-body-m text-fg-secondary">
          Ce tournoi n&apos;existe pas ou n&apos;est pas public. Vérifie l&apos;adresse, ou choisis
          un tournoi dans la liste.
        </p>
        <Link
          href="/tournois"
          className="inline-flex h-12 items-center rounded-control bg-lime px-5.5 type-label text-on-accent"
        >
          Voir les tournois
        </Link>
      </main>
    </>
  );
}
