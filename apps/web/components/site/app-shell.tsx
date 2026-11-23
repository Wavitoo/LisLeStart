"use client";

import type { AuthUser } from "@lislestart/shared";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState, type ReactNode } from "react";
import { Icon, TintedIcon } from "@/components/ui/icon";
import { logout } from "@/lib/auth/actions";
import { cx } from "@/lib/cx";

export interface NavSection {
  title: string;
  items: { href: string; label: string; icon: string }[];
}

const ROLE_LABELS: Record<AuthUser["role"], string> = {
  admin: "Administrateur",
  player: "Joueur",
  spectator: "Spectateur",
};

function isCurrent(pathname: string, href: string) {
  return href === "/" || href === "/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

function NavGroup({ section, onNavigate }: { section: NavSection; onNavigate: () => void }) {
  const pathname = usePathname();
  const titleId = useId();
  return (
    <div className="flex flex-col gap-1">
      <p id={titleId} className="py-1 pl-3 type-overline text-fg-muted">
        {section.title}
      </p>
      <ul aria-labelledby={titleId} className="flex flex-col gap-1">
        {section.items.map((item) => {
          const current = isCurrent(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                onClick={onNavigate}
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
  );
}

/** Carte profil de la maquette ; déconnexion par formulaire (marche aussi sans JavaScript). */
function Account({ user }: { user: AuthUser | null }) {
  if (!user) {
    return (
      <Link
        href="/connexion"
        className="flex h-12 items-center justify-center rounded-control bg-lime px-5.5 type-label text-on-accent"
      >
        Se connecter
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-2.5 rounded-control border border-line bg-surface p-2.5">
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-full border border-violet bg-violet-soft type-label text-violet-text"
      >
        {user.displayName.charAt(0).toUpperCase()}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate type-body-m-strong text-fg">{user.displayName}</span>
        <span className="type-caption text-fg-muted">{ROLE_LABELS[user.role]}</span>
      </span>
      <form action={logout}>
        <button
          type="submit"
          aria-label="Se déconnecter"
          title="Se déconnecter"
          className="flex size-11 items-center justify-center rounded-nav hover:bg-raised"
        >
          <Icon name="logout" size={18} />
        </button>
      </form>
    </div>
  );
}

interface AppShellProps {
  /** « Seedline » ou « Seedline admin ». */
  brand: string;
  homeHref: string;
  navLabel: string;
  sections: NavSection[];
  user: AuthUser | null;
  children: ReactNode;
}

/**
 * Barre latérale de la maquette (spectateur/joueur et admin ont chacun la leur) et contenu
 * principal. Sous 1024 px, la barre se replie derrière un bouton Menu.
 */
export function AppShell({ brand, homeHref, navLabel, sections, user, children }: AppShellProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const brandLink = (
    <Link href={homeHref} className="flex items-center gap-2.5 rounded-nav">
      <img src="/brand/seedline-mark.svg" alt="" width={28} height={28} />
      <span className="type-display-s whitespace-nowrap text-fg">{brand}</span>
    </Link>
  );
  const nav = (
    <nav aria-label={navLabel} className="flex flex-col gap-3">
      {sections.map((section) => (
        <NavGroup key={section.title} section={section} onNavigate={close} />
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen lg:flex">
      <header className="flex flex-col border-b border-line bg-sidebar px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          {brandLink}
          <button
            type="button"
            aria-expanded={open}
            aria-controls="nav-mobile"
            onClick={() => setOpen((value) => !value)}
            className="h-12 rounded-control border-2 border-line-strong px-4 type-label text-fg"
          >
            {open ? "Fermer le menu" : "Menu"}
          </button>
        </div>
        <div id="nav-mobile" hidden={!open} className="flex flex-col gap-4 pt-3">
          {nav}
          <Account user={user} />
        </div>
      </header>

      <aside className="sticky top-0 hidden h-screen w-66 shrink-0 flex-col gap-4 overflow-y-auto border-r border-line bg-sidebar px-4 pt-5 pb-4 lg:flex">
        <div className="pl-2">{brandLink}</div>
        {nav}
        <div className="mt-auto">
          <Account user={user} />
        </div>
      </aside>

      <main id="contenu" tabIndex={-1} className="min-w-0 flex-1 px-4 pt-6 pb-10 sm:px-10">
        {children}
      </main>
    </div>
  );
}
