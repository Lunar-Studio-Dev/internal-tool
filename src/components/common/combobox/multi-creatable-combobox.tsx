"use client";

import { XIcon } from "lucide-react";

import { CreatableCombobox } from "@/components/common/combobox/create-taxonomy-dialog";
import type { ComboboxOption } from "@/components/common/combobox/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/common/combobox/combobox";

export function MultiCreatableCombobox({
  options,
  values,
  onChange,
  onCreate,
  createDialogTitle,
  placeholder = "Add…",
  disabled,
}: {
  options: ComboboxOption[];
  values: string[];
  onChange: (values: string[]) => void;
  onCreate: (name: string) => Promise<{ id: string; name: string }>;
  createDialogTitle: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const available = options.filter((o) => !values.includes(o.value));
  const selected = options.filter((o) => values.includes(o.value));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {selected.map((item) => (
          <Badge key={item.value} variant="secondary" className="gap-1 pr-1 font-normal">
            {item.label}
            <button
              type="button"
              className="rounded-sm hover:bg-muted"
              disabled={disabled}
              onClick={() => onChange(values.filter((id) => id !== item.value))}
              aria-label={`Remove ${item.label}`}
            >
              <XIcon className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
      <CreatableCombobox
        options={available}
        value=""
        onChange={(id) => {
          if (id && !values.includes(id)) onChange([...values, id]);
        }}
        onCreate={onCreate}
        createDialogTitle={createDialogTitle}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}

/** Simple multi-select from existing options (no inline create). */
export function MultiCombobox({
  options,
  values,
  onChange,
  placeholder = "Add…",
  disabled,
}: {
  options: ComboboxOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const available = options.filter((o) => !values.includes(o.value));
  const selected = options.filter((o) => values.includes(o.value));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {selected.map((item) => (
          <Badge key={item.value} variant="secondary" className="gap-1 pr-1 font-normal">
            {item.label}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-4"
              disabled={disabled}
              onClick={() => onChange(values.filter((id) => id !== item.value))}
            >
              <XIcon className="size-3" />
            </Button>
          </Badge>
        ))}
      </div>
      <Combobox
        options={available}
        value=""
        onChange={(id) => {
          if (id && !values.includes(id)) onChange([...values, id]);
        }}
        placeholder={placeholder}
        disabled={disabled || available.length === 0}
      />
    </div>
  );
}
