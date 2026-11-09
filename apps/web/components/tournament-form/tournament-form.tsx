"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { CreatedTournament, CreateTournamentInput, GameSummary } from "@lislestart/shared";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import type { CreateTournamentResult } from "@/lib/api/admin-api";
import {
  LOCATION_LABELS,
  PARTICIPANT_MODE_LABELS,
  REGISTRATION_MODE_LABELS,
  VISIBILITY_LABELS,
} from "@/lib/tournament-form/labels";
import {
  LIMITS,
  thousands,
  tournamentFormSchema,
  type TournamentFormValues,
} from "@/lib/tournament-form/schema";
import {
  CHECK_IN_MINUTES,
  defaultTournamentValues,
  toCreateTournamentInput,
} from "@/lib/tournament-form/values";
import { CustomFields } from "./custom-fields";
import { ErrorSummary } from "./error-summary";
import {
  CheckboxField,
  NumberField,
  RadioField,
  SelectField,
  TextAreaField,
  TextField,
} from "./form-fields";
import { StageList } from "./stage-list";

const options = <T extends string>(labels: Record<T, string>) =>
  (Object.entries(labels) as [T, string][]).map(([value, label]) => ({ value, label }));

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section
      aria-labelledby={id}
      className="flex w-full flex-col gap-4.5 rounded-panel bg-surface p-4 sm:p-6"
    >
      <h2 id={id} className="type-heading text-fg">
        {title}
      </h2>
      {children}
    </section>
  );
}

interface TournamentFormProps {
  /** null : la liste des jeux n'a pas pu être chargée. */
  games: GameSummary[] | null;
  onSubmit: (input: CreateTournamentInput) => Promise<CreateTournamentResult>;
  defaultValues?: TournamentFormValues;
}

export function TournamentForm({ games, onSubmit, defaultValues }: TournamentFormProps) {
  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: defaultValues ?? defaultTournamentValues(),
    // Le focus va au récapitulatif d'erreurs, pas au premier champ.
    shouldFocusError: false,
  });
  const { control, handleSubmit, formState } = form;
  const participantMode = useWatch({ control, name: "participantMode" });

  const [summaryKey, setSummaryKey] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedTournament | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (serverError || created) statusRef.current?.focus();
  }, [serverError, created]);

  const submit = handleSubmit(
    async (values) => {
      setServerError(null);
      setCreated(null);
      const result = await onSubmit(toCreateTournamentInput(values));
      if (result.ok) setCreated(result.tournament);
      else setServerError(result.message);
    },
    () => {
      setCreated(null);
      setSummaryKey((key) => key + 1);
    },
  );

  const gameOptions = (games ?? []).map((game) => ({ value: game.id, label: game.name }));
  const submitting = formState.isSubmitting;

  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={submit}
        aria-busy={submitting}
        className="flex w-full flex-col gap-6"
      >
        <ErrorSummary errors={formState.errors} focusKey={summaryKey} />

        {(serverError || created) && (
          <div
            ref={statusRef}
            tabIndex={-1}
            role={serverError ? "alert" : "status"}
            className={
              serverError
                ? "rounded-panel border-2 border-alert bg-alert-soft p-5 type-body-m text-alert-text"
                : "rounded-panel border-2 border-lime bg-lime-soft p-5 type-body-m text-fg"
            }
          >
            {serverError ? (
              <>
                <span aria-hidden="true">⚠ </span>
                {serverError}
              </>
            ) : (
              <>
                <span aria-hidden="true">✓ </span>
                Tournoi « {created?.name} » publié. Les inscriptions s&apos;ouvrent selon les
                réglages choisis.
              </>
            )}
          </div>
        )}

        {/* disabled pendant l'envoi : état « désactivé » de tous les champs */}
        <fieldset disabled={submitting} className="flex min-w-0 flex-col gap-6">
          <Section id="section-general" title="1. Informations générales">
            <div className="grid gap-x-6 gap-y-4.5 md:grid-cols-2">
              <TextField name="name" label="Nom du tournoi" placeholder="Coupe d'hiver" />
              <SelectField
                name="gameId"
                label="Jeu"
                options={gameOptions}
                placeholder="Choisir un jeu"
                hint={
                  games === null
                    ? "La liste des jeux n'a pas pu être chargée : recharge la page dans un instant."
                    : undefined
                }
              />
              <TextAreaField
                name="description"
                label="Description (facultatif)"
                hint={`${thousands(LIMITS.descriptionMax)} caractères max, affichée sur la page publique`}
              />
              <TextAreaField
                name="rules"
                label="Règlement (facultatif)"
                hint="Format des matchs, retards, forfaits, litiges…"
              />
              <TextField name="startsAt" label="Début" type="datetime-local" mono />
              <TextField name="endsAt" label="Fin" type="datetime-local" mono />
              <RadioField name="location" label="Lieu" options={options(LOCATION_LABELS)} />
              <RadioField
                name="visibility"
                label="Visibilité"
                options={options(VISIBILITY_LABELS)}
              />
            </div>
          </Section>

          <Section id="section-participants" title="2. Participants et inscriptions">
            <div className="grid gap-x-5 gap-y-4.5 sm:grid-cols-2 xl:grid-cols-4">
              <SelectField
                name="participantMode"
                label="Format"
                options={options(PARTICIPANT_MODE_LABELS)}
              />
              {participantMode === "team" && (
                <>
                  <NumberField name="teamMin" label="Titulaires" hint="Taille min d'une équipe" />
                  <NumberField name="teamMax" label="Taille max" hint="Remplaçants compris" />
                </>
              )}
              <NumberField
                name="capacity"
                label="Places"
                hint={participantMode === "team" ? "Nombre d'équipes" : "Nombre de joueurs"}
              />
            </div>
            <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
              <RadioField
                name="registrationMode"
                label="Inscriptions"
                options={options(REGISTRATION_MODE_LABELS)}
              />
              <CheckboxField name="waitlist">
                Liste d&apos;attente quand c&apos;est complet
              </CheckboxField>
              <CheckboxField name="checkIn">
                Check-in {CHECK_IN_MINUTES} min avant le début
              </CheckboxField>
            </div>
            <CustomFields />
          </Section>

          <Section id="section-stages" title="3. Étapes">
            <StageList />
          </Section>
        </fieldset>

        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" soon>
            Enregistrer comme modèle
          </Button>
          <Button type="submit" variant="primary" loading={submitting} loadingLabel="Publication…">
            Publier le tournoi
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
