import type { ReactNode } from "react";

/** Contenu principal des pages publiques, aligné sur l'en-tête du site ; cible du lien d'évitement. */
export function PageMain({ children }: { children: ReactNode }) {
  return (
    <main
      id="contenu"
      tabIndex={-1}
      className="mx-auto flex max-w-7xl flex-col gap-7 px-4 pt-8 pb-16 sm:px-10 xl:px-20"
    >
      {children}
    </main>
  );
}
