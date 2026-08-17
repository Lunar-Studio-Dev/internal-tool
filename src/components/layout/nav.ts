import type { LucideIcon } from "lucide-react";
import {
  Building2Icon,
  ChartColumnIcon,
  FolderClosedIcon,
  LayoutDashboardIcon,
  ListTodoIcon,
  SettingsIcon,
  UsersIcon,
  WalletIcon,
  WorkflowIcon,
} from "lucide-react";

export type NavItem = { title: string; href: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Businesses", href: "/businesses", icon: Building2Icon },
  { title: "Pipelines", href: "/pipelines", icon: WorkflowIcon },
  { title: "To-Dos", href: "/todos", icon: ListTodoIcon },
  { title: "Resources", href: "/resources", icon: FolderClosedIcon },
  { title: "Accounts", href: "/accounts", icon: WalletIcon },
  { title: "Team", href: "/team", icon: UsersIcon },
  { title: "Analytics", href: "/analytics", icon: ChartColumnIcon },
  { title: "Settings", href: "/settings", icon: SettingsIcon },
];
