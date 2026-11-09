import Link from "next/link";

/**
 * En-tête public (maquette 5:33). Pour l'instant : la marque et « Tournois ». Les liens vers des
 * pages pas encore livrées (Mes pronostics, Groupes, Classements) et l'espace connecté viendront
 * avec elles.
 */
export function SiteHeader({ current }: { current?: "tournois" }) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-4 sm:px-10 xl:px-20">
        <Link href="/" className="flex items-center gap-2.5 rounded-field">
          <img src="/brand/seedline-icon.svg" alt="" width={40} height={40} className="size-10" />
          <span className="type-display-s text-fg">Seedline</span>
        </Link>
        <nav aria-label="Navigation principale">
          <ul className="flex items-center gap-6">
            <li>
              <Link
                href="/tournois"
                aria-current={current === "tournois" ? "true" : undefined}
                className={
                  current === "tournois"
                    ? "inline-block border-b-3 border-lime py-2.5 type-body-m-strong text-fg"
                    : "inline-block py-2.5 type-body-m-strong text-fg-secondary hover:text-fg"
                }
              >
                Tournois
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
