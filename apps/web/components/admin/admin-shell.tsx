"use client";

import type { AuthUser } from "@lislestart/shared";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { TintedIcon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";

const NAV = [
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

const ROLE_LABELS: Record<AuthUser["role"], string> = {
  admin: "Administrateur",
  player: "Joueur",
  spectator: "Spectateur",
};

function isCurrent(pathname: string, href: string) {
  return href === "/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

function Brand() {
  return (
    <span className="flex items-center gap-2.5">
      <img src="/brand/seedline-mark.svg" alt="" width={28} height={28} className="size-7" />
      <span className="type-display-s whitespace-nowrap text-fg">Seedline admin</span>
    </span>
  );
}

/** Barre latérale du back-office (maquette) ; sous 1024 px, elle se replie derrière un bouton Menu. */
export function AdminShell({ user, children }: { user: AuthUser; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <div className="flex flex-col gap-3">
      {NAV.map((section) => (
        <div key={section.title} className="flex flex-col gap-1">
          <h2 className="py-1 pl-3 type-overline text-fg-muted">{section.title}</h2>
          <ul className="flex flex-col gap-1">
            {section.items.map((item) => {
              const current = isCurrent(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={cx(
                      "flex min-h-11 items-center gap-3 rounded-nav px-3 type-body-m-strong",
                      current
                        ? "bg-lime-soft text-lime-text"
                        : "text-fg-secondary hover:bg-raised hover:text-fg",
                    )}
                  >
                    <TintedIcon name={item.icon} size={20} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      <header className="flex flex-col border-b border-line bg-sidebar px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Brand />
          <button
            type="button"
            aria-expanded={open}
            aria-controls="admin-nav-mobile"
            onClick={() => setOpen((value) => !value)}
            className="h-12 rounded-control border-2 border-line-strong px-4 type-label text-fg"
          >
            {open ? "Fermer le menu" : "Menu"}
          </button>
        </div>
        <nav id="admin-nav-mobile" aria-label="Administration" hidden={!open} className="pt-3">
          {nav}
        </nav>
      </header>

      <aside className="sticky top-0 hidden h-screen w-66 shrink-0 flex-col gap-4 border-r border-line bg-sidebar px-4 pt-5 pb-4 lg:flex">
        <div className="pl-2">
          <Brand />
        </div>
        <nav aria-label="Administration">{nav}</nav>
        <div className="mt-auto flex items-center gap-2.5 rounded-control border border-line bg-surface p-2.5">
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-violet bg-violet-soft type-label text-violet-text"
          >
            {user.displayName.charAt(0).toUpperCase()}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate type-body-m-strong text-fg">{user.displayName}</span>
            <span className="type-caption text-fg-muted">{ROLE_LABELS[user.role]}</span>
          </span>
        </div>
      </aside>

      <main id="contenu" tabIndex={-1} className="min-w-0 flex-1 px-4 pt-6 pb-8 sm:px-10">
        {children}
      </main>
    </div>
  );
}
