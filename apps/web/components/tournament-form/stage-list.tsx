"use client";

import {
  closestCenter,
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useEffect, useRef, useState } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { plural, STAGE_FORMAT_LABELS } from "@/lib/tournament-form/labels";
import { stageEntrants, type TournamentFormValues } from "@/lib/tournament-form/schema";
import { defaultStage } from "@/lib/tournament-form/values";
import { StageCard } from "./stage-card";

type FocusTarget = { id: string; part: "heading" | "up" | "down" | "format" } | { id: "add" };

/** Annonces vides : dnd-kit parle anglais par défaut, on annonce nous-mêmes en français. */
const SILENT = {
  screenReaderInstructions: { draggable: "" },
  announcements: {
    onDragStart: () => undefined,
    onDragOver: () => undefined,
    onDragEnd: () => undefined,
    onDragCancel: () => undefined,
  },
};

export function StageList() {
  const { control, trigger, formState } = useFormContext<TournamentFormValues>();
  const { fields, append, remove, move } = useFieldArray({ control, name: "stages" });
  const stages = useWatch({ control, name: "stages" });
  const capacity = useWatch({ control, name: "capacity" });
  const entrants = stageEntrants({ capacity, stages });

  // aria-live : la clé change à chaque annonce pour qu'un même texte soit relu.
  const [announcement, setAnnouncement] = useState({ text: "", key: 0 });
  const announce = (text: string) => setAnnouncement((current) => ({ text, key: current.key + 1 }));

  const elements = useRef(new Map<string, HTMLElement | null>());
  const register = (key: string) => (element: HTMLElement | null) => {
    elements.current.set(key, element);
  };
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);

  // Après un déplacement, le focus suit l'étape ; si son bouton est désactivé, on prend l'autre.
  useEffect(() => {
    if (!focusTarget) return;
    setFocusTarget(null);
    if (focusTarget.id === "add") {
      document.getElementById("add-stage")?.focus();
      return;
    }
    const { id, part } = focusTarget as Extract<FocusTarget, { part: string }>;
    const get = (name: string) => elements.current.get(`${id}-${name}`);
    let element = get(part);
    if (element instanceof HTMLButtonElement && element.disabled) {
      element = get(part === "up" ? "down" : "up");
    }
    if (part === "format") element = element?.querySelector("button") ?? element;
    element?.focus();
  }, [focusTarget]);

  const revalidate = () => {
    if (formState.isSubmitted) void trigger();
  };

  const moveStage = (from: number, to: number, part: "up" | "down" | "heading") => {
    const field = fields[from];
    if (!field || to < 0 || to >= fields.length || from === to) return;
    move(from, to);
    announce(`Étape ${from + 1} déplacée en position ${to + 1}`);
    setFocusTarget({ id: field.id, part });
    revalidate();
  };

  const removeStage = (index: number) => {
    remove(index);
    const left = fields.length - 1;
    announce(
      left === 0
        ? `Étape ${index + 1} supprimée. Aucune étape : ajoutes-en au moins une.`
        : `Étape ${index + 1} supprimée. ${plural(left, "étape restante", "étapes restantes")}.`,
    );
    const next = fields[index + 1] ?? fields[index - 1];
    setFocusTarget(next ? { id: next.id, part: "heading" } : { id: "add" });
    revalidate();
  };

  const addStage = () => {
    append(defaultStage("single_elimination"), { shouldFocus: false });
    announce(`Étape ${fields.length + 1} ajoutée : ${STAGE_FORMAT_LABELS.single_elimination}.`);
    revalidate();
  };

  // Focus sur le format de la nouvelle étape, une fois rendue.
  const lastId = fields.at(-1)?.id;
  const previousCount = useRef(fields.length);
  useEffect(() => {
    if (fields.length > previousCount.current && lastId)
      setFocusTarget({ id: lastId, part: "format" });
    previousCount.current = fields.length;
  }, [fields.length, lastId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = fields.findIndex((field) => field.id === active.id);
    const to = fields.findIndex((field) => field.id === over.id);
    if (from >= 0 && to >= 0) moveStage(from, to, "heading");
  };

  const listError =
    (formState.errors.stages as { root?: { message?: string }; message?: string } | undefined)?.root
      ?.message ?? (formState.errors.stages as { message?: string } | undefined)?.message;

  return (
    <>
      <p aria-live="polite" className="sr-only">
        <span key={announcement.key}>{announcement.text}</span>
      </p>

      {fields.length > 0 && (
        <DndContext
          id="stages-dnd"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
          accessibility={SILENT}
        >
          <SortableContext
            items={fields.map((field) => field.id)}
            strategy={verticalListSortingStrategy}
          >
            <ol
              aria-label="Étapes du tournoi, dans l'ordre"
              className="flex w-full flex-col gap-4.5"
            >
              {fields.map((field, index) => {
                const stage = stages[index];
                if (!stage) return null;
                return (
                  <StageCard
                    key={field.id}
                    sortableId={field.id}
                    index={index}
                    count={fields.length}
                    stage={stage}
                    entrants={entrants[index] ?? null}
                    onMove={moveStage}
                    onRemove={removeStage}
                    refs={{
                      heading: register(`${field.id}-heading`),
                      up: register(`${field.id}-up`),
                      down: register(`${field.id}-down`),
                      format: register(`${field.id}-format`),
                    }}
                  />
                );
              })}
            </ol>
          </SortableContext>
        </DndContext>
      )}

      <div className="flex flex-col gap-1.5">
        <Button
          id="add-stage"
          variant="add"
          onClick={addStage}
          aria-describedby={listError ? "add-stage-error" : undefined}
          className="self-start"
        >
          + Ajouter une étape (suisse, FFA, poules, élimination)
        </Button>
        <FieldError id="add-stage" message={listError} />
      </div>
    </>
  );
}
