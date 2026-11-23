"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

/** L'en-tête du tournoi n'a pas pu être chargé (API indisponible). */
export default function TournamentError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main
      id="contenu"
      tabIndex={-1}
      className="mx-auto flex max-w-xl flex-col items-start gap-4 px-4 py-16"
    >
      <h1 className="type-display-l text-fg">Tournoi indisponible</h1>
      <p className="type-body-m text-fg-secondary">
        Le serveur ne répond pas pour le moment. Réessaie dans un instant ; si le problème continue,
        consulte la liste des tournois.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={reset}>
          Réessayer
        </Button>
        <Link
          href="/tournois"
          className="inline-flex h-12 items-center rounded-control border-2 border-line-strong px-5.5 type-label text-fg"
        >
          Voir les tournois
        </Link>
      </div>
    </main>
  );
}
