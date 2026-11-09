"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { StageFormat } from "@lislestart/shared";
import type { Ref } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { cx } from "@/lib/cx";
import {
  BEST_OF_OPTIONS,
  formatShortDay,
  plural,
  SEEDING_LABELS,
  STAGE_FORMAT_LABELS,
  STAGE_FORMATS,
  TIEBREAK_PRESETS,
  TIEBREAK_PRESETS_BY_FORMAT,
} from "@/lib/tournament-form/labels";
import {
  byeCount,
  type StageFormValues,
  type TournamentFormValues,
} from "@/lib/tournament-form/schema";
import { defaultStage } from "@/lib/tournament-form/values";
import { NumberField, SelectField, TextField, type FormPath } from "./form-fields";

const FORMAT_OPTIONS = STAGE_FORMATS.map((format) => ({
  value: format,
  label: STAGE_FORMAT_LABELS[format],
}));
const BEST_OF = BEST_OF_OPTIONS.map((bestOf) => ({ value: String(bestOf), label: `BO${bestOf}` }));
const SEEDING = (["auto", "manual"] as const).map((value) => ({
  value,
  label: SEEDING_LABELS[value],
}));

export interface StageCardRefs {
  heading: Ref<HTMLHeadingElement>;
  up: Ref<HTMLButtonElement>;
  down: Ref<HTMLButtonElement>;
  format: Ref<HTMLDivElement>;
}

interface StageCardProps {
  sortableId: string;
  index: number;
  count: number;
  stage: StageFormValues;
  /** Participants qui entrent dans l'étape, si on peut le calculer. */
  entrants: number | null;
  onMove: (from: number, to: number, trigger: "up" | "down") => void;
  onRemove: (index: number) => void;
  refs: StageCardRefs;
}

function qualificationText(stage: StageFormValues, nextNumber: number): string | null {
  const count = stage.qualifiers;
  if (!Number.isInteger(count) || count < 1) return null;
  if (stage.format === "round_robin") {
    const who =
      count === 1
        ? "le premier de chaque poule rejoint"
        : `les ${count} premiers de chaque poule rejoignent`;
    return `Qualification : ${who} l'étape ${nextNumber}${count === 2 ? " (1er de A contre 2e de B…)" : ""}`;
  }
  if (stage.format === "swiss" || stage.format === "free_for_all") {
    return `Qualification : ${count === 1 ? "le premier rejoint" : `les ${count} premiers rejoignent`} l'étape ${nextNumber}`;
  }
  return null;
}

function byesText(entrants: number | null, isFirst: boolean): string {
  if (entrants === null) return isFirst ? "Selon les places" : "Selon les qualifiés";
  const unit = isFirst ? plural(entrants, "place") : plural(entrants, "qualifié");
  const byes = byeCount(entrants);
  return byes === 0 ? `Aucun (${unit})` : `${byes} (${unit})`;
}

export function StageCard({
  sortableId,
  index,
  count,
  stage,
  entrants,
  onMove,
  onRemove,
  refs,
}: StageCardProps) {
  const { setValue, formState } = useFormContext<TournamentFormValues>();
  const { listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: sortableId });

  const number = index + 1;
  const isFirst = index === 0;
  const isLast = index === count - 1;
  const name = (field: keyof StageFormValues) => `stages.${index}.${field}` as FormPath;
  const title = `Étape ${number} · ${STAGE_FORMAT_LABELS[stage.format]}`;
  // Identifiants DOM par position : les clés de useFieldArray sont aléatoires (SSR ≠ client).
  const headingId = `stage-${index}-title`;

  // Changer de format remet les réglages par défaut de ce format (le jour est conservé).
  const changeFormat = (format: string) => {
    const defaults = defaultStage(format as StageFormat);
    for (const [key, value] of Object.entries(defaults)) {
      if (key === "startsOn") continue;
      setValue(name(key as keyof StageFormValues), value as never, {
        shouldDirty: true,
        shouldValidate: formState.isSubmitted,
      });
    }
  };

  const tiebreakOptions = TIEBREAK_PRESETS_BY_FORMAT[stage.format].map((preset) => ({
    value: preset,
    label: TIEBREAK_PRESETS[preset].label,
  }));
  const qualification = isLast ? null : qualificationText(stage, number + 1);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      aria-labelledby={headingId}
      className={cx(
        "flex flex-col gap-3 rounded-control border border-line-strong bg-surface p-4.5",
        isDragging && "relative z-10 border-lime",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {/* Poignée réservée à la souris et au tactile : au clavier, Monter / Descendre. */}
          <span
            ref={setActivatorNodeRef}
            {...listeners}
            aria-hidden="true"
            title="Glisser pour déplacer l'étape"
            data-testid={`stage-handle-${index}`}
            className="flex h-11 w-6 shrink-0 cursor-grab touch-none items-center justify-center text-fg-muted active:cursor-grabbing"
          >
            ⠿
          </span>
          <h3 id={headingId} ref={refs.heading} tabIndex={-1} className="type-title text-fg">
            {title}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {stage.startsOn && (
            <p className="mr-2 type-body-m text-fg-muted">{formatShortDay(stage.startsOn)}</p>
          )}
          <Button
            ref={refs.up}
            variant="small"
            disabled={isFirst}
            aria-label={`Monter l'étape ${number}`}
            onClick={() => onMove(index, index - 1, "up")}
          >
            <span aria-hidden="true">↑</span> Monter
          </Button>
          <Button
            ref={refs.down}
            variant="small"
            disabled={isLast}
            aria-label={`Descendre l'étape ${number}`}
            onClick={() => onMove(index, index + 1, "down")}
          >
            <span aria-hidden="true">↓</span> Descendre
          </Button>
          <Button
            variant="small"
            aria-label={`Supprimer l'étape ${number}`}
            onClick={() => onRemove(index)}
            className="text-alert-text"
          >
            <span aria-hidden="true">✕</span> Supprimer
          </Button>
        </div>
      </div>

      <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
        <div ref={refs.format}>
          <SelectField
            name={name("format")}
            label="Format de l'étape"
            size="compact"
            options={FORMAT_OPTIONS}
            onValueChange={changeFormat}
          />
        </div>
        <TextField
          name={name("startsOn")}
          label="Jour (facultatif)"
          type="date"
          size="compact"
          mono
        />

        {stage.format === "round_robin" && (
          <>
            <NumberField name={name("groupCount")} label="Nombre de poules" size="compact" />
            <NumberField name={name("groupSize")} label="Participants par poule" size="compact" />
            <SelectField
              name={name("bestOf")}
              label="Matchs"
              size="compact"
              options={BEST_OF}
              numeric
            />
            <fieldset className="flex min-w-0 flex-col gap-1.5 sm:col-span-2 xl:col-span-1">
              <legend className="mb-1.5 type-body-s text-fg-secondary">Points (V · N · D)</legend>
              <div className="grid grid-cols-3 gap-2">
                <NumberField name={name("pointsWin")} label="Victoire" size="compact" />
                <NumberField name={name("pointsDraw")} label="Nul" size="compact" />
                <NumberField name={name("pointsLoss")} label="Défaite" size="compact" />
              </div>
            </fieldset>
            <SelectField
              name={name("tiebreak")}
              label="Départage"
              size="compact"
              options={tiebreakOptions}
            />
            {!isLast && (
              <NumberField name={name("qualifiers")} label="Qualifiés par poule" size="compact" />
            )}
          </>
        )}

        {(stage.format === "single_elimination" || stage.format === "double_elimination") && (
          <>
            <SelectField
              name={name("bestOf")}
              label="Matchs"
              size="compact"
              options={BEST_OF}
              numeric
            />
            <SelectField
              name={name("finalBestOf")}
              label="Finale"
              size="compact"
              options={BEST_OF}
              numeric
            />
            <SelectField name={name("seeding")} label="Seeding" size="compact" options={SEEDING} />
            {/* Valeur calculée, pas un champ : texte simple (un <output> serait une région live). */}
            <p className="flex min-w-0 flex-col gap-1.5">
              <span className="type-body-s text-fg-secondary">Exempts</span>
              <span className="flex min-h-11 items-center type-body-m text-fg">
                {byesText(entrants, isFirst)}
              </span>
            </p>
            <TextField name={name("stations")} label="Postes" placeholder="1 à 8" size="compact" />
          </>
        )}

        {stage.format === "swiss" && (
          <>
            <NumberField name={name("rounds")} label="Rondes" size="compact" />
            <SelectField
              name={name("bestOf")}
              label="Matchs"
              size="compact"
              options={BEST_OF}
              numeric
            />
            <SelectField
              name={name("tiebreak")}
              label="Départage"
              size="compact"
              options={tiebreakOptions}
            />
            {!isLast && <NumberField name={name("qualifiers")} label="Qualifiés" size="compact" />}
          </>
        )}

        {stage.format === "free_for_all" && (
          <>
            <NumberField name={name("playersPerMatch")} label="Joueurs par partie" size="compact" />
            <NumberField name={name("matchCount")} label="Parties" size="compact" />
            <TextField
              name={name("placementPoints")}
              label="Points de placement"
              hint="Du 1er au dernier, séparés par des virgules"
              size="compact"
              mono
            />
            {!isLast && <NumberField name={name("qualifiers")} label="Qualifiés" size="compact" />}
          </>
        )}
      </div>

      {qualification && (
        <p className="rounded-field bg-violet-soft px-3 py-2.5 type-body-m text-violet-text">
          {qualification}
        </p>
      )}
    </li>
  );
}
