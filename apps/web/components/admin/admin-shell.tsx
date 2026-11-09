"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { cx } from "@/lib/cx";

const NAV = [
  { href: "/admin", label: "Vue d'ensemble" },
  { href: "/admin/tournois", label: "Tournois" },
  { href: "/admin/jeux", label: "Jeux et statistiques" },
  { href: "/admin/pronostics", label: "Pronostics et Pick'em" },
  { href: "/admin/litiges", label: "Litiges" },
  { href: "/admin/audit", label: "Journal d'audit" },
];

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

/** Menu latéral du back-office (maquette) ; sous 1024 px, il se replie derrière un bouton Menu. */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <ul className="flex flex-col gap-1.5">
      {NAV.map((item) => {
        const current = isCurrent(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={current ? "page" : undefined}
              onClick={() => setOpen(false)}
              className={cx(
                "flex min-h-12 items-center rounded-field p-3",
                current
                  ? "bg-lime-soft type-label text-fg"
                  : "type-body-m text-fg-secondary hover:bg-raised hover:text-fg",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="min-h-screen lg:flex">
      <header className="flex flex-col border-b border-line px-4 py-3 lg:hidden">
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

      <aside className="hidden w-68 shrink-0 flex-col gap-1.5 border-r border-line px-4 py-6 lg:flex">
        <div className="px-2 pb-5">
          <Brand />
        </div>
        <nav aria-label="Administration">{nav}</nav>
      </aside>

      <main id="contenu" tabIndex={-1} className="min-w-0 flex-1 px-4 pt-8 pb-16 sm:px-10">
        {children}
      </main>
    </div>
  );
}
