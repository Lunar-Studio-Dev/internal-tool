'use client'

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export default function Layout({ children }: { children: React.ReactNode }) {
  const paths = usePathname()
  const [breadcrumb, setBreadcrumb] = useState([
    {
      title: "Dashboard",
      url: "/dashboard"
    }
  ])

  useEffect(() => {
    const pathArray = paths.split("/").filter(i => !!i)
    console.log(pathArray)

    const breadcrumb = pathArray.map((item, index) => {
      return {
        title: item.charAt(0).toUpperCase() + item.slice(1),
        url: `/${pathArray.slice(0, index + 1).join("/")}`
      }
    })
    setBreadcrumb(breadcrumb)
  }, [paths])
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {
                  breadcrumb.map((item, index) => {
                    if (index < breadcrumb.length - 1) {
                      return (
                        <>
                          <BreadcrumbItem className="hidden md:block" key={index}>
                            <BreadcrumbLink href={item.url}>
                              {item.title}
                            </BreadcrumbLink>
                          </BreadcrumbItem>
                          {
                            index < breadcrumb.length - 1 && (
                              <BreadcrumbSeparator className="hidden md:block" />
                            )
                          }
                        </>
                      )
                    } else {
                      return (
                        <BreadcrumbItem className="hidden md:block" key={index}>
                          <BreadcrumbPage>{item.title}</BreadcrumbPage>
                        </BreadcrumbItem>
                      )
                    }
                  })
                }
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}