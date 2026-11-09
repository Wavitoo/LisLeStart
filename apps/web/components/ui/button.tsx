"use client";

import type { ComponentProps, MouseEvent } from "react";
import { cx } from "@/lib/cx";

type Variant = "primary" | "secondary" | "add" | "link" | "small";

const VARIANTS: Record<Variant, string> = {
  primary: "h-12 whitespace-nowrap px-5.5 rounded-control bg-lime text-on-accent type-label",
  secondary:
    "h-12 whitespace-nowrap px-5.5 rounded-control border-2 border-line-strong text-fg type-label",
  // « + Ajouter une étape » : bordure pointillée de la maquette
  add: "min-h-11 py-2 text-left px-4 rounded-field border border-dashed border-line-strong text-lime-text type-body-m-strong",
  // « + Ajouter un champ » : lien d'action en lime
  link: "min-h-11 px-1 rounded-field text-lime type-body-m-strong",
  // Commandes des cartes d'étape (Monter, Descendre, Supprimer)
  small: "h-11 whitespace-nowrap px-3 rounded-field border border-line-strong text-fg type-label",
};

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
  /** Fonction pas encore livrée : bouton visible, annoncé comme indisponible, sans effet. */
  soon?: boolean;
  /** Envoi en cours : le bouton reste focalisable, annonce l'attente et ignore les clics. */
  loading?: boolean;
  loadingLabel?: string;
}

export function Button({
  variant = "secondary",
  soon = false,
  loading = false,
  loadingLabel,
  className,
  children,
  onClick,
  type = "button",
  ...props
}: ButtonProps) {
  const inactive = soon || loading;
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (inactive) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <button
      type={type}
      {...props}
      aria-disabled={inactive || props["aria-disabled"] || undefined}
      aria-busy={loading || undefined}
      onClick={handleClick}
      className={cx(
        "inline-flex max-w-full shrink-0 items-center justify-center gap-2",
        "disabled:cursor-not-allowed disabled:border-dashed disabled:text-fg-muted",
        VARIANTS[variant],
        soon && "cursor-not-allowed text-fg-muted",
        loading && "cursor-progress",
        className,
      )}
    >
      {loading ? (
        <>
          <span
            aria-hidden="true"
            className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:hidden"
          />
          {loadingLabel ?? children}
        </>
      ) : (
        children
      )}
      {soon && (
        <span className="-mr-1.5 rounded-full bg-raised px-1.5 py-0.5 text-xs font-semibold text-fg-secondary">
          Bientôt
        </span>
      )}
    </button>
  );
}
