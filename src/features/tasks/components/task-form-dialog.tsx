"use client";

import { type ReactNode, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { taskQueries } from "@/features/tasks/api";
import { TaskForm, type TaskFormInitial } from "@/features/tasks/components/task-form";
import type { TaskOptions } from "@/features/tasks/server/tasks.queries";
import { Priority, TaskStatus, type PhaseType } from "@/generated/prisma/enums";

export function TaskFormDialog({
  mode,
  options,
  initial,
  prefill,
  trigger,
}: {
  mode: "create" | "edit";
  options?: TaskOptions;
  initial?: TaskFormInitial;
  prefill?: { businessId?: string | null; pipelineId?: string | null; phaseType?: PhaseType | null };
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const optionsQuery = useQuery({ ...taskQueries.options(), enabled: open && !options });
  const resolved = options ?? optionsQuery.data;
  const mergedInitial: TaskFormInitial | undefined = initial ??
    (prefill
      ? {
          title: "",
          assigneeId: "",
          dueAt: "",
          priority: Priority.MEDIUM,
          status: TaskStatus.TODO,
          businessId: prefill.businessId ?? "",
          pipelineId: prefill.pipelineId ?? "",
          phaseType: prefill.phaseType ?? "",
          notes: "",
        }
      : undefined);

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
        {resolved ? (
          <TaskForm
            mode={mode}
            options={resolved}
            initial={mergedInitial}
            onSuccess={() => setOpen(false)}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
