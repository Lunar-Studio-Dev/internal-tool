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

/** `permission` gates visibility in the sidebar (cosmetic; routes enforce server-side). */
export type NavItem = { title: string; href: string; icon: LucideIcon; permission?: string };

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Businesses", href: "/businesses", icon: Building2Icon, permission: "business:read" },
  { title: "Pipelines", href: "/pipelines", icon: WorkflowIcon, permission: "pipeline:read" },
  { title: "To-Dos", href: "/todos", icon: ListTodoIcon, permission: "task:read" },
  { title: "Resources", href: "/resources", icon: FolderClosedIcon, permission: "resource:read" },
  { title: "Accounts", href: "/accounts", icon: WalletIcon, permission: "accounts:read" },
  { title: "Team", href: "/team", icon: UsersIcon, permission: "team:manage" },
  { title: "Analytics", href: "/analytics", icon: ChartColumnIcon, permission: "analytics:read" },
  { title: "Settings", href: "/settings", icon: SettingsIcon, permission: "settings:manage" },
];
