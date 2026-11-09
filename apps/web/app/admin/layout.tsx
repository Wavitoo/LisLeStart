import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { getCurrentUser } from "@/lib/api/server";

export const metadata: Metadata = {
  title: "Seedline admin",
  robots: { index: false },
};

// Toujours rendu à la demande : l'accès dépend de la session.
export const dynamic = "force-dynamic";

/**
 * Back-office réservé aux administrateurs. Ce contrôle évite d'afficher l'interface ; la vraie
 * protection reste côté API (@Roles("admin") sur chaque route d'écriture).
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return (
      <main id="contenu" className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-16">
        <h1 className="type-display-l text-fg">Accès réservé</h1>
        <p className="type-body-m text-fg-secondary">
          {user
            ? "Ton compte n'a pas les droits d'administration. Demande à un administrateur de la plateforme si tu dois gérer des tournois."
            : "Connecte-toi avec un compte administrateur pour accéder au back-office."}
        </p>
      </main>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
