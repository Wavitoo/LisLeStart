import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/api/server";
import { AppShell, type NavSection } from "./app-shell";

/*
 * Barre latérale publique (maquette web v2) : seules les pages livrées y figurent. Mes pronostics,
 * Groupes, Classements, Badges et Dashboard viendront avec leurs pages.
 */
const BROWSE: NavSection = {
  title: "Parcourir",
  items: [
    { href: "/", label: "Accueil", icon: "home" },
    { href: "/tournois", label: "Tournois", icon: "trophy" },
  ],
};
const ADMIN: NavSection = {
  title: "Organisation",
  items: [{ href: "/admin", label: "Administration", icon: "shield" }],
};

/** Gabarit des pages publiques : barre latérale et contenu principal. */
export async function SiteShell({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <AppShell
      brand="Seedline"
      homeHref="/"
      navLabel="Navigation principale"
      sections={user?.role === "admin" ? [BROWSE, ADMIN] : [BROWSE]}
      user={user}
    >
      <div className="flex flex-col gap-7">{children}</div>
    </AppShell>
  );
}
