import type { AuthUser } from "@lislestart/shared";
import type { ReactNode } from "react";
import { AppShell, type NavSection } from "@/components/site/app-shell";

const SECTIONS: NavSection[] = [
  {
    title: "Gestion",
    items: [
      { href: "/admin", label: "Vue d'ensemble", icon: "home" },
      { href: "/admin/tournois", label: "Tournois", icon: "trophy" },
      { href: "/admin/jeux", label: "Jeux et statistiques", icon: "gamepad" },
      { href: "/admin/pronostics", label: "Pronostics et Pick'em", icon: "target" },
    ],
  },
  {
    title: "Suivi",
    items: [
      { href: "/admin/litiges", label: "Litiges", icon: "alert-nav" },
      { href: "/admin/imports", label: "Imports start.gg", icon: "upload" },
      { href: "/admin/audit", label: "Journal d'audit", icon: "file" },
    ],
  },
];

/** Barre latérale du back-office (maquette). */
export function AdminShell({ user, children }: { user: AuthUser; children: ReactNode }) {
  return (
    <AppShell
      brand="Seedline admin"
      homeHref="/admin"
      navLabel="Administration"
      sections={SECTIONS}
      user={user}
    >
      {children}
    </AppShell>
  );
}
