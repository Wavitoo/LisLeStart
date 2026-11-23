"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { CreatedTournament, CreateTournamentInput, GameSummary } from "@lislestart/shared";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { FormProvider, useForm, useWatch, type FieldErrors } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { CreateTournamentResult } from "@/lib/api/admin-api";
import { cx } from "@/lib/cx";
import {
  formatLocalDate,
  LOCATION_LABELS,
  PARTICIPANT_MODE_LABELS,
  plural,
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
import { ErrorSummary, flattenErrors } from "./error-summary";
import {
  NumberField,
  RadioField,
  SelectField,
  SwitchField,
  TextAreaField,
  TextField,
} from "./form-fields";
import { StageList } from "./stage-list";

const options = <T extends string>(labels: Record<T, string>) =>
  (Object.entries(labels) as [T, string][]).map(([value, label]) => ({ value, label }));

/** Étapes de l'assistant (maquette) et champs validés avant de passer à la suivante. */
const STEPS = [
  {
    title: "Informations",
    hint: "Nom, jeu, dates",
    heading: "Informations générales",
    intro: "Ce que verra le public sur la page du tournoi.",
    fields: [
      "name",
      "gameId",
      "description",
      "rules",
      "startsAt",
      "endsAt",
      "location",
      "visibility",
    ],
  },
  {
    title: "Participants",
    hint: "Format et inscriptions",
    heading: "Participants et inscriptions",
    intro: "Qui peut s'inscrire, combien et comment.",
    fields: [
      "participantMode",
      "teamMin",
      "teamMax",
      "capacity",
      "registrationMode",
      "waitlist",
      "checkIn",
      "customFields",
    ],
  },
  {
    title: "Étapes",
    hint: "Poules, élimination…",
    heading: "Étapes",
    intro: "Les phases du tournoi, dans l'ordre.",
    fields: ["stages"],
  },
] satisfies {
  title: string;
  hint: string;
  heading: string;
  intro: string;
  fields: (keyof TournamentFormValues)[];
}[];

const LAST = STEPS.length - 1;

function stepErrors(errors: FieldErrors<TournamentFormValues>, index: number) {
  return Object.fromEntries(
    STEPS[index]!.fields.filter((name) => errors[name]).map((name) => [name, errors[name]]),
  ) as FieldErrors;
}

const errorCount = (errors: FieldErrors<TournamentFormValues>, index: number) =>
  flattenErrors(stepErrors(errors, index)).length;

const Separator = () => <hr className="w-full border-line" />;

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
  const { control, handleSubmit, formState, trigger } = form;
  const [participantMode, name, gameId, startsAt, endsAt, location, visibility] = useWatch({
    control,
    name: ["participantMode", "name", "gameId", "startsAt", "endsAt", "location", "visibility"],
  });

  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<ReadonlySet<number>>(new Set());
  const [summaryKey, setSummaryKey] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedTournament | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const focusHeading = useRef(false);

  useEffect(() => {
    if (serverError || created) statusRef.current?.focus();
  }, [serverError, created]);

  // Changement d'étape : le focus va au titre de la nouvelle étape, annoncé par les lecteurs d'écran.
  useEffect(() => {
    if (focusHeading.current) headingRef.current?.focus();
    focusHeading.current = false;
  }, [step]);

  const goTo = (index: number) => {
    focusHeading.current = true;
    setStep(index);
  };

  const next = async () => {
    if (await trigger(STEPS[step]!.fields)) {
      setCompleted((done) => new Set(done).add(step));
      goTo(step + 1);
    } else {
      setSummaryKey((key) => key + 1);
    }
  };

  const publish = handleSubmit(
    async (values) => {
      setServerError(null);
      setCreated(null);
      const result = await onSubmit(toCreateTournamentInput(values));
      if (result.ok) setCreated(result.tournament);
      else setServerError(result.message);
    },
    (errors) => {
      setCreated(null);
      // Ramène à la première étape en erreur ; le récapitulatif prend le focus.
      const first = STEPS.findIndex((_, index) => errorCount(errors, index) > 0);
      if (first >= 0) setStep(first);
      setSummaryKey((key) => key + 1);
    },
  );

  // Entrée dans un champ : avance d'une étape, ne publie qu'à la dernière.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    if (step < LAST) {
      event.preventDefault();
      void next();
    } else {
      void publish(event);
    }
  };

  const gameOptions = (games ?? []).map((game) => ({ value: game.id, label: game.name }));
  const gameName = games?.find((game) => game.id === gameId)?.name;
  const submitting = formState.isSubmitting;
  const current = STEPS[step]!;

  const stepHint = (index: number) => {
    const count = errorCount(formState.errors, index);
    if (count > 0) return plural(count, "point à corriger", "points à corriger");
    if (index === 0 && completed.has(0)) return [name, gameName].filter(Boolean).join(" · ");
    return STEPS[index]!.hint;
  };

  const shortDate = (value: string) => formatLocalDate(value).replace(/\/\d{4} à/, "");

  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={submit}
        aria-busy={submitting}
        className="flex w-full flex-col gap-6"
      >
        <nav aria-label="Étapes de création">
          <ol className="flex flex-col gap-3 md:flex-row md:items-center">
            {STEPS.map((item, index) => {
              const isCurrent = index === step;
              const done = completed.has(index) && errorCount(formState.errors, index) === 0;
              const hasErrors = errorCount(formState.errors, index) > 0;
              return (
                <li key={item.title} className="flex min-w-0 flex-1 items-center gap-3">
                  {index > 0 && (
                    <span
                      aria-hidden="true"
                      className={cx(
                        "hidden h-0.5 w-6 shrink-0 md:block",
                        completed.has(index - 1) ? "bg-lime" : "bg-line-strong",
                      )}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => goTo(index)}
                    aria-current={isCurrent ? "step" : undefined}
                    className={cx(
                      "flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-control py-2.5 pr-4 pl-3 text-left",
                      isCurrent ? "border-2 border-lime bg-surface" : "hover:bg-surface",
                    )}
                  >
                    <span
                      className={cx(
                        "flex size-8 shrink-0 items-center justify-center rounded-full type-label",
                        isCurrent
                          ? "bg-lime text-on-accent"
                          : done
                            ? "border border-lime bg-lime-soft"
                            : "border border-line-strong text-fg-muted",
                      )}
                    >
                      {done && !isCurrent ? (
                        <>
                          <Icon name="check" size={16} />
                          <span className="sr-only">{index + 1}</span>
                        </>
                      ) : (
                        index + 1
                      )}
                    </span>{" "}
                    <span className="flex min-w-0 flex-col">
                      <span
                        className={cx(
                          "type-body-m-strong",
                          isCurrent || done ? "text-fg" : "text-fg-muted",
                        )}
                      >
                        {item.title}
                      </span>{" "}
                      <span
                        className={cx(
                          "truncate type-caption",
                          hasErrors ? "text-alert-text" : "text-fg-muted",
                        )}
                      >
                        {stepHint(index)}
                      </span>
                    </span>
                    {done && <span className="sr-only">, terminée</span>}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

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

        <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
          <section
            aria-labelledby="step-heading"
            className="flex min-w-0 flex-1 flex-col gap-6 rounded-card border border-line bg-surface p-4 sm:px-8 sm:py-7"
          >
            <div className="flex flex-col gap-1">
              <h2
                id="step-heading"
                ref={headingRef}
                tabIndex={-1}
                className="type-display-s text-fg"
              >
                {current.heading}
              </h2>
              <p className="type-body-m text-fg-muted">{current.intro}</p>
            </div>

            <ErrorSummary errors={stepErrors(formState.errors, step)} focusKey={summaryKey} />

            {/* disabled pendant l'envoi : état « désactivé » de tous les champs */}
            <fieldset disabled={submitting} className="flex min-w-0 flex-col gap-6">
              {/* Étapes masquées mais montées : les valeurs et l'ordre des étapes sont conservés. */}
              <div hidden={step !== 0} className="grid gap-x-6 gap-y-4.5 md:grid-cols-2">
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

              <div hidden={step !== 1} className="flex flex-col gap-6">
                <RadioField
                  name="participantMode"
                  label="Format"
                  options={options(PARTICIPANT_MODE_LABELS)}
                  segmented
                />
                <div className="grid gap-5 sm:grid-cols-3">
                  {participantMode === "team" && (
                    <>
                      <NumberField
                        name="teamMin"
                        label="Titulaires"
                        hint="Joueurs sur le terrain."
                      />
                      <NumberField name="teamMax" label="Taille max" hint="Remplaçants compris." />
                    </>
                  )}
                  <NumberField
                    name="capacity"
                    label="Places"
                    hint={participantMode === "team" ? "Nombre d'équipes." : "Nombre de joueurs."}
                  />
                </div>
                <Separator />
                <div className="flex flex-col divide-y divide-line rounded-panel border border-line bg-night">
                  <SwitchField
                    name="registrationMode"
                    label="Inscriptions sur validation"
                    description="Tu acceptes chaque inscription avant la publication."
                    on="approval"
                    off="open"
                  />
                  <SwitchField
                    name="waitlist"
                    label="Liste d'attente"
                    description="Quand c'est complet, les absents au check-in sont remplacés."
                  />
                  <SwitchField
                    name="checkIn"
                    label="Check-in"
                    description={`Ouvert ${CHECK_IN_MINUTES} min avant le premier match.`}
                  />
                </div>
                <CustomFields />
              </div>

              <div hidden={step !== 2}>
                <StageList />
              </div>
            </fieldset>

            <Separator />
            <div className="flex flex-wrap items-center gap-3">
              {step > 0 && (
                <Button variant="secondary" onClick={() => goTo(step - 1)}>
                  Retour
                </Button>
              )}
              <span className="flex-1" />
              <Button variant="plain" soon>
                Enregistrer comme modèle
              </Button>
              {step < LAST ? (
                <Button type="submit" variant="primary">
                  Continuer · {STEPS[step + 1]!.title}
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                  loadingLabel="Publication…"
                >
                  Publier le tournoi
                </Button>
              )}
            </div>
          </section>

          <aside
            aria-labelledby="recap-heading"
            className="flex shrink-0 flex-col gap-4 rounded-card border border-line bg-surface px-6 py-5.5 xl:sticky xl:top-6 xl:w-80"
          >
            <h2 id="recap-heading" className="type-display-s text-fg">
              Récapitulatif
            </h2>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="type-overline text-fg-muted">1 · Informations</h3>
                {step !== 0 && (
                  <button
                    type="button"
                    onClick={() => goTo(0)}
                    className="min-h-11 type-body-s text-lime-text"
                  >
                    Modifier<span className="sr-only"> les informations</span>
                  </button>
                )}
              </div>
              <dl className="flex flex-col gap-2.5">
                {[
                  ["Nom", name.trim()],
                  ["Jeu", gameName],
                  [
                    "Dates",
                    startsAt && endsAt ? `${shortDate(startsAt)} → ${shortDate(endsAt)}` : "",
                  ],
                  [
                    "Lieu · visibilité",
                    `${LOCATION_LABELS[location]} · ${VISIBILITY_LABELS[visibility].toLowerCase()}`,
                  ],
                ].map(([term, value]) => (
                  <div key={term} className="flex flex-col gap-0.5">
                    <dt className="type-caption text-fg-muted">{term}</dt>
                    <dd className="type-body-m-strong break-words text-fg">{value || "—"}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <Separator />
            <div className="flex flex-col gap-2.5">
              <h3 className="type-overline text-fg-muted">Vérifications</h3>
              <ul className="flex flex-col gap-2.5">
                {STEPS.map((item, index) => {
                  const count = errorCount(formState.errors, index);
                  const ok = completed.has(index) && count === 0;
                  return (
                    <li key={item.title} className="flex items-start gap-2 type-body-s">
                      {count > 0 ? (
                        <Icon name="alert" size={16} className="mt-0.5" />
                      ) : ok ? (
                        <Icon name="check" size={16} className="mt-0.5" />
                      ) : (
                        <span aria-hidden="true" className="w-4 shrink-0 text-center text-fg-muted">
                          ·
                        </span>
                      )}
                      <span className={count > 0 ? "text-alert-text" : "text-fg-secondary"}>
                        {item.title} :{" "}
                        {count > 0
                          ? plural(count, "point à corriger", "points à corriger")
                          : ok
                            ? "complet"
                            : "à remplir"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        </div>
      </form>
    </FormProvider>
  );
}
