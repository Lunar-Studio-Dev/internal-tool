"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavItems } from "@/components/nav-items"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { GalleryVerticalEndIcon, AudioLinesIcon, TerminalIcon, TerminalSquareIcon, BotIcon, BookOpenIcon, Settings2Icon, FrameIcon, PieChartIcon, MapIcon } from "lucide-react"
import { authClient } from "@/lib/auth-client"

// This is sample data.
const data = {
  navMain: [
    {
      name: "Dashboard",
      url: "/dashboard",
      icon: (
        <TerminalSquareIcon
        />
      )
    },
    {
      name: "Quotations",
      url: "/dashboard/quotations",
      icon: (
        <TerminalSquareIcon
        />
      )
    },
    {
      name: "Templates",
      url: "/dashboard/templates",
      icon: (
        <TerminalSquareIcon
        />
      )
    },
    {
      name: "Settings",
      url: "/dashboard/settings",
      icon: (
        <Settings2Icon
        />
      )
    }
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession();

  const fallbackUser = {
    name: "Loading...",
    email: "",
    avatar: "",
  };

  const currentUser = session?.user ? {
    name: session.user.name || "User",
    email: session.user.email,
    avatar: session.user.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${session.user.name}`,
  } : fallbackUser;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavUser user={currentUser} />
      </SidebarHeader>
      <SidebarContent>
        <NavItems items={data.navMain} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
