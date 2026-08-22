"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Building2Icon,
  FileIcon,
  ListTodoIcon,
  SearchIcon,
  WorkflowIcon,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { searchQueries } from "@/features/search/api";
import type { SearchResultDto } from "@/features/search/api";

const TYPE_ICONS = {
  business: Building2Icon,
  pipeline: WorkflowIcon,
  resource: FileIcon,
  task: ListTodoIcon,
} as const;

export function GlobalSearchTrigger() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const searchQuery = useQuery({
    ...searchQueries.query(query),
    enabled: open && query.trim().length >= 2,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const navigate = (item: SearchResultDto) => {
    setOpen(false);
    setQuery("");
    router.push(item.href);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setQuery("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-9 items-center gap-2 rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted sm:flex"
      >
        <SearchIcon className="size-4" />
        Search…
        <kbd className="pointer-events-none ml-2 hidden rounded border bg-background px-1.5 font-mono text-[10px] lg:inline">
          ⌘K
        </kbd>
      </button>
      {mounted ? (
        <CommandDialog
          open={open}
          onOpenChange={handleOpenChange}
          title="Search"
          description="Find businesses, pipelines, resources, and tasks"
        >
          <CommandInput
            placeholder="Search…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>
              {query.trim().length < 2
                ? "Type at least 2 characters…"
                : searchQuery.isFetching
                  ? "Searching…"
                  : "No results found."}
            </CommandEmpty>
            <CommandGroup heading="Results">
              {(searchQuery.data ?? []).map((item: SearchResultDto) => {
                const Icon = TYPE_ICONS[item.type as keyof typeof TYPE_ICONS];
                return (
                  <CommandItem
                    key={`${item.type}-${item.id}`}
                    value={`${item.type}-${item.id}`}
                    onSelect={() => navigate(item)}
                  >
                    <Icon className="size-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span>{item.title}</span>
                      {item.subtitle ? (
                        <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                      ) : null}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      ) : null}
    </>
  );
}
