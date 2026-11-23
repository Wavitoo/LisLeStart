"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { useId, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./icon";

/*
 * Boutons radio et cases à cocher Radix. Chaque contrôle est enveloppé dans son <label> : toute la
 * ligne (44 px de haut) est cliquable. L'état coché se lit à la forme (point, coche), pas qu'à la
 * couleur.
 */

const rowClass = "flex min-h-11 cursor-pointer items-center gap-2 type-body-m text-fg";

interface RadioGroupProps<T extends string> {
  label: string;
  name: string;
  value: T;
  onValueChange: (value: T) => void;
  options: { value: T; label: string }[];
  disabled?: boolean;
  /** Identifiant du premier bouton, cible des liens du récapitulatif d'erreurs. */
  id?: string;
}

export function RadioGroup<T extends string>({
  label,
  name,
  value,
  onValueChange,
  options,
  disabled,
  id,
}: RadioGroupProps<T>) {
  const labelId = useId();
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p id={labelId} className="type-label text-fg">
        {label}
      </p>
      <RadioGroupPrimitive.Root
        aria-labelledby={labelId}
        name={name}
        value={value}
        onValueChange={(next) => onValueChange(next as T)}
        disabled={disabled}
        className="flex flex-wrap gap-x-4"
      >
        {options.map((option, index) => (
          <label key={option.value} className={rowClass}>
            <RadioGroupPrimitive.Item
              id={index === 0 ? id : undefined}
              value={option.value}
              className="flex size-4.5 shrink-0 items-center justify-center rounded-full border-2 border-line-control data-[state=checked]:border-lime disabled:cursor-not-allowed disabled:border-dashed"
            >
              <RadioGroupPrimitive.Indicator className="size-2 rounded-full bg-lime" />
            </RadioGroupPrimitive.Item>
            {option.label}
          </label>
        ))}
      </RadioGroupPrimitive.Root>
    </div>
  );
}

interface CheckboxProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  onBlur?: () => void;
  disabled?: boolean;
  name?: string;
  children: ReactNode;
}

export function Checkbox({
  id,
  checked,
  onCheckedChange,
  onBlur,
  disabled,
  name,
  children,
}: CheckboxProps) {
  return (
    <label className={cx(rowClass, "gap-2.5")}>
      <CheckboxPrimitive.Root
        id={id}
        name={name}
        checked={checked}
        onCheckedChange={(state) => onCheckedChange(state === true)}
        onBlur={onBlur}
        disabled={disabled}
        className="flex size-5 shrink-0 items-center justify-center rounded-sm border-2 border-line-control data-[state=checked]:border-lime data-[state=checked]:bg-lime disabled:cursor-not-allowed disabled:border-dashed"
      >
        <CheckboxPrimitive.Indicator
          aria-hidden="true"
          className="type-label leading-none text-on-accent"
        >
          ✓
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {children}
    </label>
  );
}

/**
 * Contrôle segmenté de la maquette (Solo / En équipe). C'est un choix de valeur dans un formulaire :
 * sémantique radiogroup (flèches pour changer), pas tablist. La sélection se lit au relief, pas
 * qu'à la couleur.
 */
export function Segmented<T extends string>({
  label,
  name,
  value,
  onValueChange,
  options,
  disabled,
  id,
}: RadioGroupProps<T>) {
  const labelId = useId();
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p id={labelId} className="type-label text-fg-secondary">
        {label}
      </p>
      <RadioGroupPrimitive.Root
        aria-labelledby={labelId}
        name={name}
        value={value}
        onValueChange={(next) => onValueChange(next as T)}
        disabled={disabled}
        orientation="horizontal"
        className="flex w-fit gap-0.5 rounded-control bg-sidebar p-0.75"
      >
        {options.map((option, index) => (
          <RadioGroupPrimitive.Item
            key={option.value}
            id={index === 0 ? id : undefined}
            value={option.value}
            className={cx(
              "flex h-11 items-center justify-center rounded-nav border border-transparent px-4 type-body-m-strong text-fg-muted",
              "data-[state=checked]:border-line-strong data-[state=checked]:bg-raised data-[state=checked]:text-fg data-[state=checked]:shadow-md",
              "disabled:cursor-not-allowed",
            )}
          >
            {option.label}
          </RadioGroupPrimitive.Item>
        ))}
      </RadioGroupPrimitive.Root>
    </div>
  );
}

interface SwitchRowProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  onBlur?: () => void;
  disabled?: boolean;
  label: string;
  description: string;
}

/** Ligne de réglage avec interrupteur ; l'état est aussi écrit en toutes lettres (maquette). */
export function SwitchRow({
  id,
  checked,
  onCheckedChange,
  onBlur,
  disabled,
  label,
  description,
}: SwitchRowProps) {
  const labelId = useId();
  return (
    <div className="flex items-center gap-4 px-4.5 py-3.5">
      <div className="flex min-w-0 flex-1 flex-col">
        <p id={labelId} className="type-body-m-strong text-fg">
          {label}
        </p>
        <p id={`${labelId}-desc`} className="type-caption text-fg-muted">
          {description}
        </p>
      </div>
      <span aria-hidden="true" className="type-body-s text-fg-muted">
        {checked ? "Activé" : "Désactivé"}
      </span>
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={`${labelId}-desc`}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        onBlur={onBlur}
        className="flex h-11 shrink-0 items-center rounded-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Icon name={checked ? "switch-on" : "switch-off"} size={46} height={28} />
      </button>
    </div>
  );
}
