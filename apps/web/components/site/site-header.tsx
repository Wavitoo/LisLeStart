import type { AuthUser } from "@lislestart/shared";
import Link from "next/link";
import { getCurrentUser } from "@/lib/api/server";
import { logout } from "@/lib/auth/actions";

/**
 * En-tête public (maquette 5:33) : la marque, « Tournois » et l'espace de connexion. Les liens
 * vers des pages pas encore livrées (Mes pronostics, Groupes, Classements) viendront avec elles.
 */
export async function SiteHeader({ current }: { current?: "tournois" }) {
  const user = await getCurrentUser();
  return <SiteHeaderView current={current} user={user} />;
}

/** Rendu de l'en-tête pour un utilisateur donné, sans lecture de session. */
export function SiteHeaderView({ current, user }: { current?: "tournois"; user: AuthUser | null }) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-4 sm:px-10 xl:px-20">
        <Link href="/" className="flex items-center gap-2.5 rounded-field">
          <img src="/brand/seedline-icon.svg" alt="" width={40} height={40} className="size-10" />
          <span className="type-display-s text-fg">Seedline</span>
        </Link>
        <nav aria-label="Navigation principale" className="flex-1">
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
        {user ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="type-body-m text-fg-secondary">
              <span className="sr-only">Connecté en tant que </span>
              <span className="font-semibold text-fg">{user.displayName}</span>
            </p>
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="inline-flex h-11 items-center rounded-field px-3 type-body-m-strong text-fg-secondary hover:text-fg"
              >
                Administration
              </Link>
            )}
            {/* Formulaire et action serveur : la déconnexion marche aussi sans JavaScript */}
            <form action={logout}>
              <button
                type="submit"
                className="h-11 rounded-field border border-line-strong px-4 type-label text-fg"
              >
                Se déconnecter
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/connexion"
            className="inline-flex h-11 items-center rounded-field border border-line-strong px-4 type-label text-fg"
          >
            Se connecter
          </Link>
        )}
      </div>
    </header>
  );
}
