"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { useId, type ReactNode } from "react";
import { cx } from "@/lib/cx";

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
