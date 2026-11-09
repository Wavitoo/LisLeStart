"use client";

import type { ReactNode } from "react";
import { Controller, get, useFormContext, type Path } from "react-hook-form";
import { Checkbox, RadioGroup } from "@/components/ui/choice";
import { controlClass, Field, fieldId } from "@/components/ui/field";
import { Select, type SelectOption } from "@/components/ui/select";
import { cx } from "@/lib/cx";
import type { TournamentFormValues } from "@/lib/tournament-form/schema";

/* Champs du formulaire de tournoi, branchés sur react-hook-form (FormProvider). */

export type FormPath = Path<TournamentFormValues>;

function useFieldError(name: FormPath): string | undefined {
  const {
    formState: { errors },
  } = useFormContext<TournamentFormValues>();
  return (get(errors, name) as { message?: string } | undefined)?.message;
}

interface BaseProps {
  name: FormPath;
  label: ReactNode;
  hint?: ReactNode;
  size?: "default" | "compact";
  className?: string;
}

interface TextFieldProps extends BaseProps {
  type?: "text" | "datetime-local" | "date";
  placeholder?: string;
  autoComplete?: string;
  /** Chiffres et dates en JetBrains Mono (Mono/S de la maquette). */
  mono?: boolean;
}

export function TextField({
  name,
  label,
  hint,
  size,
  className,
  type = "text",
  placeholder,
  autoComplete = "off",
  mono,
}: TextFieldProps) {
  const { register } = useFormContext<TournamentFormValues>();
  const error = useFieldError(name);
  const id = fieldId(name);
  return (
    <Field id={id} label={label} hint={hint} error={error} size={size} className={className}>
      {(a11y) => (
        <input
          {...a11y}
          {...register(name)}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={cx(controlClass, mono ? "type-mono-s" : "type-body-m")}
        />
      )}
    </Field>
  );
}

export function NumberField({ name, label, hint, size, className }: BaseProps) {
  const { register } = useFormContext<TournamentFormValues>();
  const error = useFieldError(name);
  const id = fieldId(name);
  return (
    <Field id={id} label={label} hint={hint} error={error} size={size} className={className}>
      {(a11y) => (
        <input
          {...a11y}
          {...register(name, { valueAsNumber: true })}
          type="number"
          inputMode="numeric"
          step={1}
          className={cx(controlClass, "type-mono-s")}
        />
      )}
    </Field>
  );
}

export function TextAreaField({ name, label, hint, className }: BaseProps) {
  const { register } = useFormContext<TournamentFormValues>();
  const error = useFieldError(name);
  const id = fieldId(name);
  return (
    <Field id={id} label={label} hint={hint} error={error} className={className}>
      {(a11y) => (
        <textarea
          {...a11y}
          {...register(name)}
          rows={4}
          className={cx(controlClass, "h-auto min-h-28 resize-y py-2.5 type-body-m")}
        />
      )}
    </Field>
  );
}

interface SelectFieldProps extends BaseProps {
  options: SelectOption[];
  placeholder?: string;
  /** Les valeurs numériques (BO) sont converties à l'enregistrement. */
  numeric?: boolean;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

export function SelectField({
  name,
  label,
  hint,
  size,
  className,
  options,
  placeholder,
  numeric,
  onValueChange,
  disabled,
}: SelectFieldProps) {
  const { control } = useFormContext<TournamentFormValues>();
  const error = useFieldError(name);
  const id = fieldId(name);
  return (
    <Field id={id} label={label} hint={hint} error={error} size={size} className={className}>
      {(a11y) => (
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <Select
              {...a11y}
              name={field.name}
              value={String(field.value ?? "")}
              disabled={disabled ?? field.disabled}
              onBlur={field.onBlur}
              onValueChange={(value) => {
                if (onValueChange) onValueChange(value);
                else field.onChange(numeric ? Number(value) : value);
              }}
              options={options}
              placeholder={placeholder}
            />
          )}
        />
      )}
    </Field>
  );
}

export function RadioField<T extends string>({
  name,
  label,
  options,
}: {
  name: FormPath;
  label: string;
  options: { value: T; label: string }[];
}) {
  const { control } = useFormContext<TournamentFormValues>();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <RadioGroup<T>
          id={fieldId(name)}
          label={label}
          name={field.name}
          value={field.value as T}
          onValueChange={field.onChange}
          disabled={field.disabled}
          options={options}
        />
      )}
    />
  );
}

export function CheckboxField({ name, children }: { name: FormPath; children: ReactNode }) {
  const { control } = useFormContext<TournamentFormValues>();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Checkbox
          id={fieldId(name)}
          name={field.name}
          checked={field.value === true}
          onCheckedChange={field.onChange}
          onBlur={field.onBlur}
          disabled={field.disabled}
        >
          {children}
        </Checkbox>
      )}
    />
  );
}
