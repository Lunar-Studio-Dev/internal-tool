"use client";

import { useMemo } from "react";

import { Combobox } from "@/components/common/combobox/combobox";
import type { ComboboxOption } from "@/components/common/combobox/types";

export type PipelineOption = {
  id: string;
  label?: string;
  code?: string;
  name?: string;
};

function pipelineLabel(option: PipelineOption) {
  if (option.label) return option.label;
  if (option.code && option.name) return `${option.code} · ${option.name}`;
  return option.code ?? option.name ?? option.id;
}

export function PipelineCombobox({
  options,
  value,
  onChange,
  disabled,
  id,
  className,
  placeholder = "Select pipeline…",
  allowClear,
  clearLabel = "None",
  clearValue = "__none__",
}: {
  options: PipelineOption[];
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
      const label = pipelineLabel(option);
      items.push({
        value: option.id,
        label,
        keywords: [option.code, option.name, option.label].filter(Boolean).join(" "),
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
      searchPlaceholder="Search pipeline…"
      emptyMessage="No pipelines found."
      disabled={disabled}
    />
  );
}
