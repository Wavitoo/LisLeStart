import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Gabarit Se connecter / Créer un compte (maquette « Connexion ») : panneau de marque à gauche
 * (masqué sous 1024 px), formulaire à droite.
 */
export function AuthPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col gap-8 border-r border-line bg-surface px-20 py-18 lg:flex">
        <Link href="/" className="flex w-fit items-center gap-3.5 rounded-nav">
          <img src="/brand/seedline-mark.svg" alt="" width={40} height={40} className="size-10" />
          <span className="type-display-m text-fg">Seedline</span>
        </Link>
        <div className="flex-1" />
        <p className="max-w-140 type-display-xl text-fg">
          Pronostique en direct. Grimpe au classement.
        </p>
        <p className="max-w-130 type-body-l text-fg-secondary">
          Suis les tournois de ta LAN ou de start.gg, remplis ton arbre avant le coup d&apos;envoi
          et affronte tes amis dans des classements privés. Des points, des badges et des titres.
          Jamais d&apos;argent.
        </p>
        {/* Illustration : un match fictif, comme sur la maquette */}
        <figure
          aria-label="Exemple de match en direct"
          className="flex max-w-130 flex-col gap-4 rounded-card border border-line bg-night px-6 pt-5 pb-6 shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-lime-soft px-3 py-1.5 type-label text-lime-text">
              <span aria-hidden="true" className="size-2 rounded-full bg-lime" />
              En direct
            </span>
            <span className="type-body-s text-fg-muted">Coupe d&apos;hiver · Demi-finale 1</span>
          </div>
          <div className="flex items-center text-fg">
            <span className="flex-1 type-headline">Les Hiboux</span>
            <span className="font-mono text-xl font-bold">1 – 1</span>
            <span className="flex-1 text-right type-headline">Kraken Club</span>
          </div>
          <div aria-hidden="true" className="flex h-2.5 gap-0.75">
            <span className="w-[72%] rounded-l-full bg-lime" />
            <span className="flex-1 rounded-r-full bg-violet" />
          </div>
          <figcaption className="flex justify-between gap-3 type-body-s text-fg-secondary">
            <span>72 % voient Les Hiboux gagner</span>
            <span>28 % Kraken Club</span>
          </figcaption>
        </figure>
      </div>

      <main
        id="contenu"
        tabIndex={-1}
        className="flex w-full flex-col items-center justify-center px-4 py-10 sm:px-16 lg:w-160 lg:shrink-0"
      >
        <div className="flex w-full max-w-100 flex-col gap-5">
          <Link href="/" className="flex w-fit items-center gap-2.5 rounded-nav lg:hidden">
            <img src="/brand/seedline-mark.svg" alt="" width={28} height={28} />
            <span className="type-display-s text-fg">Seedline</span>
          </Link>
          <div className="flex flex-col gap-2">
            <h1 className="type-display-l text-fg">{title}</h1>
            <p className="type-body-m text-fg-muted">{intro}</p>
          </div>
          {children}
          <div className="flex items-center gap-3 type-caption text-fg-muted">
            <hr className="flex-1 border-line" />
            ou
            <hr className="flex-1 border-line" />
          </div>
          <Link
            href="/tournois"
            className="flex h-12 items-center justify-center rounded-control border-2 border-line-strong px-5.5 type-label text-fg"
          >
            Parcourir les tournois sans compte
          </Link>
          <p className="text-center type-caption text-fg-muted">Données de démo uniquement</p>
        </div>
      </main>
    </div>
  );
}
