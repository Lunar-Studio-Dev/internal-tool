"use client";

import { useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { FilterIcon, SearchIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function SearchField({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative min-w-0 flex-1", className)}>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-8"
      />
    </div>
  );
}

export function FilterChipGroup<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((item) => (
        <Button
          key={item.value}
          type="button"
          variant={value === item.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </Button>
      ))}
    </div>
  );
}

export function FilterSheetSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

export function useFilterSheetDraft<T>(applied: T, open: boolean) {
  const [draft, setDraft] = useState<T>(applied);
  const wasOpenRef = useRef(false);
  const appliedRef = useRef(applied);
  appliedRef.current = applied;

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setDraft(appliedRef.current);
    }
    wasOpenRef.current = open;
  }, [open]);

  return {
    draft,
    setDraft: setDraft as Dispatch<SetStateAction<T>>,
  };
}

function FilterTriggerButton({
  activeCount,
  onClick,
  className,
}: {
  activeCount: number;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn("relative shrink-0", className)}
      onClick={onClick}
      aria-label={activeCount > 0 ? `Filters (${activeCount} active)` : "Filters"}
    >
      <FilterIcon className="size-4" />
      {activeCount > 0 ? (
        <Badge
          variant="default"
          className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full p-0 text-[10px]"
        >
          {activeCount}
        </Badge>
      ) : null}
    </Button>
  );
}

export function ListFilterBar({
  search,
  onSearchChange,
  searchPlaceholder,
  showSearch = true,
  activeFilterCount = 0,
  filterOpen,
  onFilterOpenChange,
  onApplyFilters,
  onResetFilters,
  filterSheetTitle = "Filters",
  filterSheetContent,
  desktopFilters,
  actions,
}: {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  activeFilterCount?: number;
  filterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  filterSheetTitle?: string;
  filterSheetContent: ReactNode;
  desktopFilters?: ReactNode;
  actions?: ReactNode;
}) {
  const hasSheet = Boolean(filterSheetContent);

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 md:hidden">
          {showSearch && onSearchChange != null ? (
            <div className="flex gap-2">
              <SearchField
                value={search ?? ""}
                onChange={onSearchChange}
                placeholder={searchPlaceholder}
              />
              {hasSheet ? (
                <FilterTriggerButton
                  activeCount={activeFilterCount}
                  onClick={() => onFilterOpenChange(true)}
                />
              ) : null}
            </div>
          ) : null}
          {!showSearch && hasSheet ? (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="relative min-w-0 flex-1"
                onClick={() => onFilterOpenChange(true)}
              >
                <FilterIcon className="size-4" />
                Filters
                {activeFilterCount > 0 ? (
                  <Badge variant="secondary" className="ml-1">
                    {activeFilterCount}
                  </Badge>
                ) : null}
              </Button>
              {actions}
            </div>
          ) : null}
          {showSearch && actions ? (
            <div className="flex flex-wrap gap-2 [&_button]:flex-1">{actions}</div>
          ) : null}
        </div>

        <div className="hidden flex-wrap items-center gap-2 md:flex">
          {showSearch && onSearchChange != null ? (
            <SearchField
              value={search ?? ""}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
              className="min-w-52"
            />
          ) : null}
          {desktopFilters}
          {actions}
        </div>
      </div>

      {hasSheet ? (
        <Sheet open={filterOpen} onOpenChange={onFilterOpenChange}>
          <SheetContent side="bottom" className="max-h-[85vh] gap-0 p-0" showCloseButton={false}>
            <SheetHeader className="flex-row items-center justify-between border-b px-4 py-3">
              <SheetTitle>{filterSheetTitle}</SheetTitle>
              <Button type="button" variant="ghost" size="sm" onClick={onResetFilters}>
                Reset
              </Button>
            </SheetHeader>
            <div className="flex flex-col gap-5 overflow-y-auto px-4 py-4">{filterSheetContent}</div>
            <SheetFooter className="border-t px-4 py-3">
              <Button
                type="button"
                className="w-full"
                onClick={() => {
                  onApplyFilters();
                  onFilterOpenChange(false);
                }}
              >
                Apply filters
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  );
}

/** Count how many filter fields differ from their defaults. */
export function countActiveFilters(
  current: Record<string, unknown>,
  defaults: Record<string, unknown>,
): number {
  return Object.keys(defaults).reduce((count, key) => {
    return current[key] !== defaults[key] ? count + 1 : count;
  }, 0);
}
