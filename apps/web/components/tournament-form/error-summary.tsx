"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import type { FieldErrors } from "react-hook-form";
import { fieldId } from "@/components/ui/field";
import { plural } from "@/lib/tournament-form/labels";

export interface SummaryItem {
  /** Identifiant DOM du contrôle à focaliser. */
  target: string;
  message: string;
}

/** Cible des erreurs de liste (aucune étape, trop de champs) : le bouton d'ajout correspondant. */
export const LIST_TARGETS: Record<string, string> = {
  stages: "add-stage",
  customFields: "add-custom-field",
};

/** Aplatit les erreurs react-hook-form en une liste { cible, message }. */
export function flattenErrors(errors: FieldErrors, prefix = ""): SummaryItem[] {
  const items: SummaryItem[] = [];
  for (const [key, value] of Object.entries(errors)) {
    if (!value || typeof value !== "object" || key === "ref") continue;
    const path = key === "root" ? prefix : prefix ? `${prefix}.${key}` : key;
    const message = (value as { message?: unknown }).message;
    if (typeof message === "string" && message !== "") {
      items.push({ target: LIST_TARGETS[path] ?? fieldId(path), message });
    }
    if (key !== "root") items.push(...flattenErrors(value as FieldErrors, path));
  }
  return items;
}

/** Trie les erreurs dans l'ordre du formulaire (ordre du document). */
function inDocumentOrder(items: SummaryItem[]): SummaryItem[] {
  if (typeof document === "undefined") return items;
  return [...items].sort((a, b) => {
    const first = document.getElementById(a.target);
    const second = document.getElementById(b.target);
    if (!first || !second) return 0;
    return first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  });
}

interface ErrorSummaryProps {
  errors: FieldErrors;
  /** Incrémenté à chaque envoi refusé : le récapitulatif reprend alors le focus. */
  focusKey: number;
}

/**
 * Récapitulatif en haut du formulaire après un envoi refusé : un lien par erreur, qui place le
 * focus sur le champ concerné. Il suit les corrections en direct et disparaît quand tout est bon.
 */
export function ErrorSummary({ errors, focusKey }: ErrorSummaryProps) {
  const ref = useRef<HTMLDivElement>(null);
  const items = inDocumentOrder(flattenErrors(errors));

  const visible = focusKey > 0 && items.length > 0;

  // react-hook-form publie les erreurs juste après onInvalid : on attend que le récapitulatif
  // soit affiché pour lui donner le focus, une fois par envoi refusé.
  const focusedKey = useRef(0);
  useEffect(() => {
    if (visible && focusKey > focusedKey.current) {
      focusedKey.current = focusKey;
      ref.current?.focus();
    }
  }, [visible, focusKey]);

  if (!visible) return null;

  const focusField = (event: MouseEvent<HTMLAnchorElement>, target: string) => {
    const element = document.getElementById(target);
    if (!element) return;
    event.preventDefault();
    element.scrollIntoView({ block: "center" });
    element.focus();
  };

  return (
    <div
      ref={ref}
      tabIndex={-1}
      aria-labelledby="error-summary-title"
      className="flex w-full flex-col gap-2 rounded-panel border-2 border-alert bg-alert-soft p-5"
    >
      <h2 id="error-summary-title" className="type-heading text-fg">
        <span aria-hidden="true">⚠ </span>
        Le formulaire contient {plural(items.length, "erreur")}
      </h2>
      <p className="type-body-m text-fg-secondary">
        Corrige les champs suivants puis publie à nouveau :
      </p>
      <ul className="flex list-disc flex-col gap-1 pl-5">
        {items.map((item) => (
          <li key={`${item.target}-${item.message}`} className="type-body-m text-alert-text">
            <a
              href={`#${item.target}`}
              onClick={(event) => focusField(event, item.target)}
              className="underline underline-offset-2"
            >
              {item.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
