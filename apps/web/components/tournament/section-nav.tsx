/**
 * Sections de la page d'un tournoi, dans l'ordre de la navigation : ancre (#planning…), titre et
 * complément du message de chargement. Seule source de ces valeurs.
 */
export const TOURNAMENT_SECTIONS = {
  bracket: { id: "arbre", title: "Arbre", loading: "de l'arbre" },
  participants: { id: "participants", title: "Participants", loading: "des participants" },
  schedule: { id: "planning", title: "Planning", loading: "du planning" },
  standings: { id: "classement", title: "Classement", loading: "du classement" },
} as const;

export type TournamentSectionKey = keyof typeof TOURNAMENT_SECTIONS;

/** Navigation interne collante : de simples ancres, l'adresse reflète la section (#planning…). */
export function SectionNav() {
  return (
    <nav
      aria-label="Sections du tournoi"
      className="sticky top-0 z-10 -mx-4 border-b border-line bg-night px-4 py-2 sm:-mx-10 sm:px-10 xl:-mx-20 xl:px-20"
    >
      <ul className="flex flex-wrap gap-2">
        {Object.values(TOURNAMENT_SECTIONS).map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="flex h-11 items-center rounded-field px-4 type-body-m-strong text-fg-secondary hover:bg-raised hover:text-fg"
            >
              {section.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
