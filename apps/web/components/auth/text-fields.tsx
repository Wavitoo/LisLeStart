"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { controlClass, Field, fieldId } from "@/components/ui/field";
import { cx } from "@/lib/cx";

type InputProps = Omit<ComponentProps<"input">, "id" | "className">;

interface TextFieldProps extends InputProps {
  name: string;
  label: string;
  error?: string;
  hint?: ReactNode;
}

/** Champ texte libellé, avec aide et erreur liées par aria-describedby. */
export function AuthTextField({ name, label, error, hint, ...input }: TextFieldProps) {
  const id = fieldId(name);
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      {(a11y) => (
        <input {...input} {...a11y} name={name} className={cx(controlClass, "type-body-m")} />
      )}
    </Field>
  );
}

/**
 * Mot de passe avec bouton « Afficher » : utile sur mobile et pour vérifier sa saisie sans champ de
 * confirmation (WCAG 3.3.8, authentification accessible). Le bouton est un arrêt de tabulation
 * distinct, après le champ.
 */
export function PasswordField({ name, label, error, hint, ...input }: TextFieldProps) {
  const id = fieldId(name);
  const [visible, setVisible] = useState(false);
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      {(a11y) => (
        <div className="flex gap-2">
          <input
            {...input}
            {...a11y}
            name={name}
            type={visible ? "text" : "password"}
            spellCheck={false}
            autoCapitalize="none"
            className={cx(controlClass, "type-body-m")}
          />
          <button
            type="button"
            aria-controls={id}
            aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            onClick={() => setVisible((value) => !value)}
            className="h-11 shrink-0 rounded-field border border-line-strong px-3 type-label text-fg"
          >
            {visible ? "Masquer" : "Afficher"}
          </button>
        </div>
      )}
    </Field>
  );
}
