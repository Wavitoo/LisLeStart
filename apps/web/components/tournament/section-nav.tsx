export const TOURNAMENT_SECTIONS = [
  { id: "arbre", label: "Arbre" },
  { id: "participants", label: "Participants" },
  { id: "planning", label: "Planning" },
  { id: "classement", label: "Classement" },
] as const;

/** Navigation interne collante : de simples ancres, l'adresse reflète la section (#planning…). */
export function SectionNav() {
  return (
    <nav
      aria-label="Sections du tournoi"
      className="sticky top-0 z-10 -mx-4 border-b border-line bg-night px-4 py-2 sm:-mx-10 sm:px-10 xl:-mx-20 xl:px-20"
    >
      <ul className="flex flex-wrap gap-2">
        {TOURNAMENT_SECTIONS.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="flex h-11 items-center rounded-field px-4 type-body-m-strong text-fg-secondary hover:bg-raised hover:text-fg"
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
