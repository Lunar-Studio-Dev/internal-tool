import { PlusIcon, SearchIcon } from "lucide-react";

import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-6" />
      {/* Command palette trigger — wired to real global search in a later phase. */}
      <button
        type="button"
        className="hidden h-9 items-center gap-2 rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted sm:flex"
      >
        <SearchIcon className="size-4" />
        Search…
      </button>
      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" className="gap-1.5">
          <PlusIcon className="size-4" />
          <span className="hidden sm:inline">New</span>
        </Button>
        <ModeToggle />
      </div>
    </header>
  );
}
