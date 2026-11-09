import type { Metadata } from "next";
import Link from "next/link";
import { TournamentForm } from "@/components/tournament-form/tournament-form";
import { Button } from "@/components/ui/button";
import { getAdminApi } from "@/lib/api/server";
import { createTournament } from "./actions";

export const metadata: Metadata = { title: "Créer un tournoi · Seedline admin" };

export default async function NewTournamentPage() {
  const games = await (await getAdminApi()).listGames();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <nav aria-label="Fil d'Ariane">
            <ol className="flex gap-1 text-sm text-fg-muted">
              <li>
                <Link href="/admin/tournois" className="underline-offset-2 hover:underline">
                  Tournois
                </Link>
                <span aria-hidden="true"> ›</span>
              </li>
              <li aria-current="page">Nouveau</li>
            </ol>
          </nav>
          <h1 className="type-display-l text-fg">Créer un tournoi</h1>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button soon>Partir d&apos;un modèle</Button>
          <Button soon>Importer CSV / JSON</Button>
          <Button soon>Importer depuis start.gg</Button>
        </div>
      </div>

      <TournamentForm games={games} onSubmit={createTournament} />
    </div>
  );
}
