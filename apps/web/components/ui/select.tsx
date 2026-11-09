"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { cx } from "@/lib/cx";
import { controlClass, type ControlA11y } from "./field";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends ControlA11y {
  value: string;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  name?: string;
}

/** Liste déroulante Radix : clavier (flèches, saisie, Échap) et rôle combobox fournis. */
export function Select({
  value,
  onValueChange,
  onBlur,
  options,
  placeholder = "Choisir…",
  disabled,
  name,
  ...a11y
}: SelectProps) {
  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      name={name}
    >
      <SelectPrimitive.Trigger
        {...a11y}
        onBlur={onBlur}
        className={cx(
          controlClass,
          "flex items-center justify-between gap-2 text-left type-body-m",
        )}
      >
        <span className="truncate data-[placeholder]:text-fg-muted">
          <SelectPrimitive.Value placeholder={placeholder} />
        </span>
        <SelectPrimitive.Icon aria-hidden="true" className="text-fg-muted">
          ▾
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className="z-50 max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) overflow-hidden rounded-field border border-line-strong bg-raised"
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-field px-3 type-body-m text-fg outline-none data-[highlighted]:bg-lime-soft data-[state=checked]:font-semibold"
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator aria-hidden="true" className="text-lime">
                  ✓
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
