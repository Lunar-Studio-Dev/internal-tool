"use client";

import { useMemo } from "react";

import { Combobox } from "@/components/common/combobox/combobox";
import type { ComboboxOption } from "@/components/common/combobox/types";

export type BusinessOption = { id: string; name: string; website?: string | null };

export function BusinessCombobox({
  options,
  value,
  onChange,
  disabled,
  id,
  className,
  placeholder = "Search business…",
  allowAll,
  allLabel = "All businesses",
  allValue = "ALL",
  allowClear,
  clearLabel = "None",
  clearValue = "NONE",
}: {
  options: BusinessOption[];
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  placeholder?: string;
  allowAll?: boolean;
  allLabel?: string;
  allValue?: string;
  allowClear?: boolean;
  clearLabel?: string;
  clearValue?: string;
}) {
  const comboboxOptions = useMemo((): ComboboxOption[] => {
    const items: ComboboxOption[] = [];
    if (allowAll) items.push({ value: allValue, label: allLabel });
    if (allowClear) items.push({ value: clearValue, label: clearLabel });
    for (const option of options) {
      items.push({
        value: option.id,
        label: option.name,
        keywords: option.website ?? undefined,
        description: option.website ?? undefined,
      });
    }
    return items;
  }, [options, allowAll, allLabel, allValue, allowClear, clearLabel, clearValue]);

  const comboboxValue =
    value && value.length > 0
      ? value
      : allowAll
        ? allValue
        : allowClear
          ? clearValue
          : "";

  return (
    <Combobox
      id={id}
      className={className}
      options={comboboxOptions}
      value={comboboxValue}
      onChange={onChange}
      placeholder={placeholder}
      searchPlaceholder="Search business…"
      emptyMessage="No businesses found."
      disabled={disabled}
    />
  );
}
