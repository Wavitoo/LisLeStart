import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site/site-header";

/** Gabarit des pages Se connecter / Créer un compte : une carte centrée sous l'en-tête du site. */
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
    <>
      <SiteHeader />
      <main id="contenu" tabIndex={-1} className="mx-auto w-full max-w-lg px-4 pt-10 pb-16">
        <div className="flex flex-col gap-6 rounded-card bg-surface p-5 sm:p-8">
          <div className="flex flex-col gap-2">
            <h1 className="type-display-l text-fg">{title}</h1>
            <p className="type-body-m text-fg-secondary">{intro}</p>
          </div>
          {children}
        </div>
      </main>
    </>
  );
}
