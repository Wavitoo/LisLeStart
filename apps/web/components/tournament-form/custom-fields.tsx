"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState, type FormEvent } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/choice";
import { controlClass, Field, FieldError } from "@/components/ui/field";
import { cx } from "@/lib/cx";
import { LIMITS, type TournamentFormValues } from "@/lib/tournament-form/schema";

/** Valide le libellé d'un nouveau champ ; renvoie le message d'erreur ou null. */
export function validateCustomFieldLabel(label: string, existing: string[]): string | null {
  const value = label.trim();
  if (value === "") return "Indique le nom du champ : par exemple « Pseudo en jeu ».";
  if (value.length > LIMITS.customFieldLabelMax) {
    return `Le nom dépasse ${LIMITS.customFieldLabelMax} caractères (${value.length}) : raccourcis-le.`;
  }
  if (existing.some((other) => other.trim().toLowerCase() === value.toLowerCase())) {
    return `Le champ « ${value} » existe déjà : choisis un autre nom.`;
  }
  return null;
}

/** Champs personnalisés demandés à l'inscription : puces retirables et ajout dans une boîte de dialogue. */
export function CustomFields() {
  const { control, formState } = useFormContext<TournamentFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "customFields" });
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [required, setRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listError = formState.errors.customFields as
    { root?: { message?: string }; message?: string } | undefined;
  const listMessage = listError?.root?.message ?? listError?.message;
  const full = fields.length >= LIMITS.customFieldsMax;

  const reset = () => {
    setLabel("");
    setRequired(false);
    setError(null);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    // La boîte est rendue dans un portail mais reste dans l'arbre React du formulaire principal.
    event.preventDefault();
    event.stopPropagation();
    const message = validateCustomFieldLabel(
      label,
      fields.map((field) => field.label),
    );
    if (message) {
      setError(message);
      document.getElementById("custom-field-label")?.focus();
      return;
    }
    append({ label: label.trim(), required }, { shouldFocus: false });
    setOpen(false);
    reset();
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <p id="custom-fields-label" className="type-body-m text-fg-secondary">
          Champs personnalisés :
        </p>
        {fields.length === 0 ? (
          <p className="type-body-m text-fg-muted">aucun</p>
        ) : (
          <ul aria-labelledby="custom-fields-label" className="flex flex-wrap items-center gap-2">
            {fields.map((field, index) => (
              <li
                key={field.id}
                className="flex items-center gap-1 rounded-full bg-raised py-0.5 pr-0.5 pl-2.5 type-body-s text-fg"
              >
                {field.label}
                {field.required && <span className="text-fg-secondary"> · obligatoire</span>}
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Retirer le champ « ${field.label} »`}
                  className="flex size-6 items-center justify-center rounded-full text-fg-secondary hover:bg-line-strong"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <Dialog.Root
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) reset();
          }}
        >
          <Dialog.Trigger asChild>
            <Button
              id="add-custom-field"
              variant="link"
              disabled={full}
              aria-describedby={listMessage ? "add-custom-field-error" : undefined}
            >
              + Ajouter un champ
            </Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-night/80" />
            <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-panel border border-line-strong bg-surface p-6">
              <Dialog.Title className="type-heading text-fg">Ajouter un champ</Dialog.Title>
              <Dialog.Description className="type-body-m text-fg-secondary">
                Ce champ sera demandé à chaque inscription, par exemple un pseudo en jeu ou un rang.
              </Dialog.Description>
              <form noValidate onSubmit={submit} className="flex flex-col gap-4">
                <Field id="custom-field-label" label="Nom du champ" error={error ?? undefined}>
                  {(a11y) => (
                    <input
                      {...a11y}
                      value={label}
                      onChange={(event) => {
                        setLabel(event.target.value);
                        if (error) setError(null);
                      }}
                      autoComplete="off"
                      className={cx(controlClass, "type-body-m")}
                    />
                  )}
                </Field>
                <Checkbox checked={required} onCheckedChange={setRequired}>
                  Réponse obligatoire
                </Checkbox>
                <div className="flex flex-wrap justify-end gap-3">
                  <Dialog.Close asChild>
                    <Button variant="secondary">Annuler</Button>
                  </Dialog.Close>
                  <Button type="submit" variant="primary">
                    Ajouter le champ
                  </Button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
      {full && (
        <p className="type-body-s text-fg-muted">
          {LIMITS.customFieldsMax} champs au maximum : retire un champ pour en ajouter un autre.
        </p>
      )}
      <FieldError id="add-custom-field" message={listMessage} />
    </div>
  );
}
