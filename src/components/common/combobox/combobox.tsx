"use client";

import { useState } from "react";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";

import type { ComboboxOption } from "@/components/common/combobox/types";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ComboboxProps = {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  searchable?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  /** When set, empty search shows a create action instead of only emptyMessage. */
  onCreateNew?: (searchTerm: string) => void;
  createLabel?: (searchTerm: string) => string;
};

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyMessage = "No results found.",
  searchable = true,
  disabled,
  id,
  className,
  onCreateNew,
  createLabel = (term) => `Create "${term}"`,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = options.find((o) => o.value === value) ?? null;
  const trimmedSearch = search.trim();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          id={id}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(24rem,var(--radix-popover-trigger-width))] p-0" align="start">
        <Command shouldFilter={searchable}>
          {searchable ? (
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={setSearch}
            />
          ) : null}
          <CommandList>
            <CommandEmpty>
              {onCreateNew && trimmedSearch ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent"
                  onClick={() => {
                    onCreateNew(trimmedSearch);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <PlusIcon className="size-4 shrink-0" />
                  {createLabel(trimmedSearch)}
                </button>
              ) : (
                emptyMessage
              )}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={[option.label, option.keywords, option.description].filter(Boolean).join(" ")}
                    disabled={option.disabled}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <CheckIcon
                      className={cn("size-4", option.value === value ? "opacity-100" : "opacity-0")}
                    />
                    <span className="truncate">{option.label}</span>
                    {option.description ? (
                      <span className="ml-auto truncate text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
