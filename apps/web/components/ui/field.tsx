import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

/** Identifiant DOM d'un champ à partir de son nom (« stages.0.format » → « field-stages-0-format »). */
export function fieldId(name: string): string {
  return `field-${name.replace(/\./g, "-")}`;
}

/** Attributs d'accessibilité à poser sur le contrôle : erreur et aide liées par aria-describedby. */
export interface ControlA11y {
  id: string;
  "aria-invalid": true | undefined;
  "aria-describedby": string | undefined;
}

export function controlA11y(id: string, error?: string, hint?: ReactNode): ControlA11y {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy.length > 0 ? describedBy.join(" ") : undefined,
  };
}

/** Bordure des champs : 1 px au repos, lime au focus, 2 px corail en erreur (maquette). */
export const controlClass = cx(
  "h-11 w-full min-w-0 rounded-field border border-line-control bg-night px-3 text-fg",
  "placeholder:text-fg-muted focus:border-lime",
  "aria-[invalid=true]:border-2 aria-[invalid=true]:border-alert",
  "disabled:cursor-not-allowed disabled:border-dashed disabled:text-fg-muted",
);

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} className="type-body-s text-alert-text">
      <span aria-hidden="true">⚠ </span>
      <span className="sr-only">Erreur :</span> {message}
    </p>
  );
}

export function FieldHint({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={`${id}-hint`} className="type-body-s text-fg-muted">
      {children}
    </p>
  );
}

interface FieldProps {
  id: string;
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  /** compact : libellé discret des réglages d'étape (Body/S, muted dans la maquette). */
  size?: "default" | "compact";
  className?: string;
  children: (a11y: ControlA11y) => ReactNode;
}

/** Libellé, contrôle, aide et message d'erreur, empilés comme dans la maquette. */
export function Field({
  id,
  label,
  error,
  hint,
  size = "default",
  className,
  children,
}: FieldProps) {
  return (
    <div className={cx("flex min-w-0 flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className={size === "compact" ? "type-body-s text-fg-secondary" : "type-label text-fg"}
      >
        {label}
      </label>
      {children(controlA11y(id, error, hint))}
      <FieldHint id={id}>{hint}</FieldHint>
      <FieldError id={id} message={error} />
    </div>
  );
}
