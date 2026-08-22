import { ModeToggle } from "@/components/mode-toggle";
import { QuickNewMenu } from "@/components/layout/quick-new-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { GlobalSearchTrigger } from "@/features/search/components/global-search-trigger";
import { NotificationsBell } from "@/features/notifications/components/notifications-bell";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-6" />
      <GlobalSearchTrigger />
      <div className="ml-auto flex items-center gap-2">
        <NotificationsBell />
        <QuickNewMenu />
        <ModeToggle />
      </div>
    </header>
  );
}
