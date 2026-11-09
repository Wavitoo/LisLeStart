import type { ReactNode } from "react";

/** Données d'une section : chargées, ou en erreur (les autres sections restent affichées). */
export type SectionData<T> = { ok: true; data: T } | { ok: false };

export function TournamentSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      // scroll-mt : la cible d'une ancre n'est pas cachée par la navigation collante
      className="flex min-w-0 scroll-mt-24 flex-col gap-5 rounded-card bg-surface p-4 sm:p-6"
    >
      <h2 id={`${id}-title`} className="type-display-m text-fg">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-field border border-dashed border-line-strong p-5 type-body-m text-fg-secondary">
      {children}
    </p>
  );
}

export function SectionError({ what }: { what: string }) {
  return (
    <p className="rounded-field border-2 border-alert bg-alert-soft p-5 type-body-m text-alert-text">
      <span aria-hidden="true">⚠ </span>
      Impossible de charger {what} pour le moment : recharge la page dans un instant.
    </p>
  );
}

/**
 * Conteneur à défilement horizontal, focalisable pour défiler aux flèches du clavier
 * (WCAG 2.1.1). Une seule tabulation : aucun élément focalisable à l'intérieur.
 */
export function ScrollRegion({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="-mx-1 overflow-x-auto px-1 py-1 [scrollbar-color:var(--color-line-strong)_transparent]"
    >
      {children}
    </div>
  );
}

/** Section en cours de chargement : le titre reste en place, le contenu arrive en streaming. */
export function SectionLoading({ id, title, what }: { id: string; title: string; what: string }) {
  return (
    <TournamentSection id={id} title={title}>
      <p role="status" className="type-body-m text-fg-secondary">
        Chargement {what}…
      </p>
      <div
        aria-hidden="true"
        className="h-48 animate-pulse rounded-field bg-raised motion-reduce:animate-none"
      />
    </TournamentSection>
  );
}
