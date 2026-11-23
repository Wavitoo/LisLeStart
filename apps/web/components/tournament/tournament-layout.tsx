import type { ReactNode } from "react";

/**
 * Colonne principale (sections) et colonne latérale de 340 px de la maquette. La colonne latérale
 * accueillera « Mon pronostic » et le Pick'em (issue séparée) ; sans elle, les sections prennent
 * toute la largeur.
 */
export function TournamentLayout({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex flex-col gap-7 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-7">{children}</div>
      {aside && <aside className="flex flex-col gap-5 lg:w-85 lg:shrink-0">{aside}</aside>}
    </div>
  );
}
