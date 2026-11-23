import type { Metadata } from "next";
import Link from "next/link";
import { TournamentForm } from "@/components/tournament-form/tournament-form";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { getAdminApi } from "@/lib/api/server";
import { createTournament } from "./actions";

export const metadata: Metadata = { title: "Nouveau tournoi · Seedline admin" };

export default async function NewTournamentPage() {
  const games = await (await getAdminApi()).listGames();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <nav aria-label="Fil d'Ariane" className="flex-1">
          <ol className="flex items-center gap-1.5 type-body-m">
            <li className="flex items-center gap-1.5">
              <Link
                href="/admin/tournois"
                className="text-fg-muted underline-offset-2 hover:underline"
              >
                Tournois
              </Link>
              <Icon name="chevron-right" size={14} />
            </li>
            <li aria-current="page" className="type-body-m-strong text-fg-secondary">
              Nouveau tournoi
            </li>
          </ol>
        </nav>
        <Button variant="plain" soon>
          Partir d&apos;un modèle
        </Button>
        <Button soon>Importer (CSV, JSON, start.gg)</Button>
      </div>

      <h1 className="type-display-xl break-words text-fg">Nouveau tournoi</h1>

      <TournamentForm games={games} onSubmit={createTournament} />
    </div>
  );
}
