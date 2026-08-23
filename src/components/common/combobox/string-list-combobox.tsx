"use client";

import { useMemo } from "react";

import { Combobox } from "@/components/common/combobox/combobox";
import type { ComboboxOption } from "@/components/common/combobox/types";

export function StringListCombobox({
  options,
  value,
  onChange,
  placeholder = "Select…",
  allowAll,
  allLabel = "All",
  allValue = "ALL",
  id,
  className,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allowAll?: boolean;
  allLabel?: string;
  allValue?: string;
  id?: string;
  className?: string;
}) {
  const comboboxOptions = useMemo((): ComboboxOption[] => {
    const items: ComboboxOption[] = allowAll
      ? [{ value: allValue, label: allLabel }]
      : [];
    for (const option of options) {
      items.push({ value: option, label: option });
    }
    return items;
  }, [options, allowAll, allLabel, allValue]);

  return (
    <Combobox
      id={id}
      className={className}
      options={comboboxOptions}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      searchPlaceholder="Search…"
      emptyMessage="No results found."
    />
  );
}
