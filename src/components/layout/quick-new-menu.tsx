"use client";

import Link from "next/link";
import { Building2Icon, FileIcon, ListTodoIcon, PlusIcon, WorkflowIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function QuickNewMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <PlusIcon className="size-4" />
          <span className="hidden sm:inline">New</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/businesses">
            <Building2Icon className="size-4" />
            Business
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/pipelines">
            <WorkflowIcon className="size-4" />
            Pipeline
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/todos">
            <ListTodoIcon className="size-4" />
            Task
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/resources">
            <FileIcon className="size-4" />
            Resource
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
