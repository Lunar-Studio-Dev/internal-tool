"use client";

import { useMemo } from "react";

import { Combobox } from "@/components/common/combobox/combobox";
import type { ComboboxOption } from "@/components/common/combobox/types";
import { formatINR } from "@/features/phases/constants";

export type QuotationOption = {
  id: string;
  version: number;
  subtotal: number;
};

export function QuotationCombobox({
  options,
  value,
  onChange,
  disabled,
  id,
  className,
  placeholder = "Select quotation…",
  allowClear,
  clearLabel = "None",
  clearValue = "__none__",
}: {
  options: QuotationOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  placeholder?: string;
  allowClear?: boolean;
  clearLabel?: string;
  clearValue?: string;
}) {
  const comboboxOptions = useMemo((): ComboboxOption[] => {
    const items: ComboboxOption[] = allowClear
      ? [{ value: clearValue, label: clearLabel }]
      : [];
    for (const option of options) {
      items.push({
        value: option.id,
        label: `V${option.version} · ${formatINR(option.subtotal)}`,
        keywords: String(option.version),
      });
    }
    return items;
  }, [options, allowClear, clearLabel, clearValue]);

  return (
    <Combobox
      id={id}
      className={className}
      options={comboboxOptions}
      value={value || (allowClear ? clearValue : "")}
      onChange={onChange}
      placeholder={placeholder}
      searchPlaceholder="Search quotation…"
      emptyMessage="No quotations found."
      disabled={disabled}
    />
  );
}
