"use client";

import { useMemo } from "react";

import { Combobox } from "@/components/common/combobox/combobox";
import type { ComboboxOption } from "@/components/common/combobox/types";

export function EnumCombobox({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchable = true,
  disabled,
  id,
  className,
  allowClear,
  clearLabel = "None",
  clearValue = "NONE",
}: {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  allowClear?: boolean;
  clearLabel?: string;
  clearValue?: string;
}) {
  const comboboxOptions = useMemo((): ComboboxOption[] => {
    const items: ComboboxOption[] = allowClear
      ? [{ value: clearValue, label: clearLabel }]
      : [];
    return [...items, ...options];
  }, [allowClear, clearLabel, clearValue, options]);

  return (
    <Combobox
      id={id}
      className={className}
      options={comboboxOptions}
      value={value || (allowClear ? clearValue : "")}
      onChange={onChange}
      placeholder={placeholder}
      searchable={searchable}
      disabled={disabled}
    />
  );
}
