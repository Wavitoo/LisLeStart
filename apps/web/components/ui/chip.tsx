import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

/*
 * Chip d'état (composant Figma 2:29) : icône + mot, jamais la couleur seule.
 * « live » reprend la variante Direct ; « neutral » sert aux états sans variante dessinée.
 */
type Variant = "live" | "neutral" | "success" | "alert";

const VARIANTS: Record<Variant, string> = {
  live: "bg-lime-soft text-lime-text",
  success: "bg-lime-soft text-lime-text",
  neutral: "bg-raised text-fg-secondary",
  alert: "bg-alert-soft text-alert-text",
};

export function Chip({
  variant = "neutral",
  icon,
  children,
  className,
}: {
  variant?: Variant;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 type-label whitespace-nowrap",
        VARIANTS[variant],
        className,
      )}
    >
      {variant === "live" ? (
        // Icône « Direct » de la maquette
        <img src="/brand/icon-live.svg" alt="" width={16} height={16} className="size-4" />
      ) : (
        icon && <span aria-hidden="true">{icon}</span>
      )}
      {children}
    </span>
  );
}
