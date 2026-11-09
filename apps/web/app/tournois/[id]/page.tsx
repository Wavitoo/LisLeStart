import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site/site-header";
import { BracketSection } from "@/components/tournament/bracket-section";
import { ParticipantsSection } from "@/components/tournament/participants-section";
import { ScheduleSection } from "@/components/tournament/schedule-section";
import { SectionLoading, type SectionData } from "@/components/tournament/section";
import { StandingsSection } from "@/components/tournament/standings-section";
import { TournamentView } from "@/components/tournament/tournament-view";
import { getPublicApi } from "@/lib/api/server";

// Données en direct, page publique sans session : rendue à chaque requête côté serveur.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const detail = await getPublicApi()
    .tournament(id)
    .catch(() => null);
  return { title: detail ? `${detail.name} · Seedline` : "Tournoi · Seedline" };
}

/** Une section en panne n'empêche pas d'afficher les autres. */
async function load<T>(promise: Promise<T>): Promise<SectionData<T>> {
  try {
    return { ok: true, data: await promise };
  } catch {
    return { ok: false };
  }
}

async function Bracket({ id }: { id: string }) {
  return <BracketSection result={await load(getPublicApi().bracket(id))} />;
}
async function Participants({ id }: { id: string }) {
  return <ParticipantsSection result={await load(getPublicApi().participants(id))} />;
}
async function Schedule({ id }: { id: string }) {
  return <ScheduleSection result={await load(getPublicApi().schedule(id))} />;
}
async function Standings({ id }: { id: string }) {
  return <StandingsSection result={await load(getPublicApi().standings(id))} />;
}

export default async function TournamentPage({ params }: Props) {
  const { id } = await params;

  // L'en-tête est attendu avant tout envoi : un tournoi inconnu répond bien 404 (pas de loading.tsx,
  // qui enverrait un 200 avant de savoir). Une panne ici passe par error.tsx.
  const detail = await getPublicApi().tournament(id);
  if (!detail) notFound();

  // Les sections arrivent ensuite en streaming, chacune avec son état de chargement.
  return (
    <>
      <SiteHeader current="tournois" />
      <main
        id="contenu"
        tabIndex={-1}
        className="mx-auto flex max-w-7xl flex-col gap-7 px-4 pt-8 pb-16 sm:px-10 xl:px-20"
      >
        <TournamentView
          detail={detail}
          bracket={
            <Suspense fallback={<SectionLoading id="arbre" title="Arbre" what="de l'arbre" />}>
              <Bracket id={id} />
            </Suspense>
          }
          participants={
            <Suspense
              fallback={
                <SectionLoading id="participants" title="Participants" what="des participants" />
              }
            >
              <Participants id={id} />
            </Suspense>
          }
          schedule={
            <Suspense
              fallback={<SectionLoading id="planning" title="Planning" what="du planning" />}
            >
              <Schedule id={id} />
            </Suspense>
          }
          standings={
            <Suspense
              fallback={<SectionLoading id="classement" title="Classement" what="du classement" />}
            >
              <Standings id={id} />
            </Suspense>
          }
        />
      </main>
    </>
  );
}
