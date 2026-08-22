"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  BellIcon,
  ChevronsUpDownIcon,
  KeyRoundIcon,
  ListTodoIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";

import { ChangePasswordDialog } from "@/features/auth/components/change-password-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { signOutAction } from "@/features/auth/actions";
import { ROLE_LABELS } from "@/features/team/constants";
import { useCan, useCurrentMember } from "@/features/team/hooks/use-current-member";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "U";
}

export function UserMenu() {
  const { isMobile } = useSidebar();
  const [isPending, startTransition] = useTransition();
  const [pwOpen, setPwOpen] = useState(false);
  const member = useCurrentMember();
  const canSettings = useCan("settings:manage");

  const name = member.name || "User";
  const email = member.email;
  const roles = member.roleNames.map((role) => ROLE_LABELS[role]).join(" · ");

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              <Avatar className="size-8 rounded-lg">
                {member.image ? <AvatarImage src={member.image} alt={name} /> : null}
                <AvatarFallback className="rounded-lg">{initialsOf(name)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="truncate text-xs text-muted-foreground">{email}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-60 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="truncate font-medium">{name}</span>
              <span className="truncate text-xs font-normal text-muted-foreground">{email}</span>
              {roles ? (
                <span className="truncate pt-1 text-xs font-normal text-muted-foreground">
                  {roles}
                </span>
              ) : null}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <UserIcon className="size-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/todos">
                  <ListTodoIcon className="size-4" />
                  My tasks
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/activity">
                  <BellIcon className="size-4" />
                  Activity
                </Link>
              </DropdownMenuItem>
              {canSettings ? (
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <SettingsIcon className="size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  // Defer so the dropdown finishes closing before the dialog opens.
                  setTimeout(() => setPwOpen(true), 0);
                }}
              >
                <KeyRoundIcon className="size-4" />
                Change password
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={isPending}
              onSelect={(event) => {
                event.preventDefault();
                startTransition(async () => {
                  await signOutAction();
                });
              }}
            >
              <LogOutIcon className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ChangePasswordDialog open={pwOpen} onOpenChange={setPwOpen} />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
