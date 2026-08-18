"use client";

import { type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TaskForm, type TaskFormInitial } from "@/features/tasks/components/task-form";
import type { TaskOptions } from "@/features/tasks/server/tasks.queries";

export function TaskFormDialog({
  mode,
  options,
  initial,
  trigger,
}: {
  mode: "create" | "edit";
  options: TaskOptions;
  initial?: TaskFormInitial;
  trigger: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create To-Do" : "Edit To-Do"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a task and optionally link it to a business, pipeline, or phase."
              : "Update this task's details."}
          </DialogDescription>
        </DialogHeader>
        <TaskForm
          mode={mode}
          options={options}
          initial={initial}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
