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

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
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
    }
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavUser user={data.user} />
      </SidebarHeader>
      <SidebarContent>
        <NavItems items={data.navMain} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
