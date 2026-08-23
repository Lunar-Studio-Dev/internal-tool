"use client";

import { useMemo } from "react";

import { Combobox } from "@/components/common/combobox/combobox";
import type { ComboboxOption } from "@/components/common/combobox/types";

export type ReasonOption = { id: string; label: string };

export function ReasonCombobox({
  options,
  value,
  onChange,
  disabled,
  id,
  className,
  placeholder = "Select a reason…",
}: {
  options: ReasonOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  placeholder?: string;
}) {
  const comboboxOptions = useMemo(
    (): ComboboxOption[] =>
      options.map((option) => ({
        value: option.id,
        label: option.label,
      })),
    [options],
  );

  return (
    <Combobox
      id={id}
      className={className}
      options={comboboxOptions}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      searchPlaceholder="Search reason…"
      emptyMessage="No reasons found."
      disabled={disabled}
    />
  );
}
