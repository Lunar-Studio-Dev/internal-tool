"use client";

import { type FormEvent, useState, useTransition } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PRIORITY_LABELS, PRIORITY_ORDER, TASK_STATUS_LABELS, TASK_STATUS_ORDER } from "@/features/tasks/constants";
import { createTaskAction, updateTaskAction } from "@/features/tasks/server/tasks.actions";
import type { TaskOptions } from "@/features/tasks/server/tasks.queries";
import { PHASE_LABELS, PHASE_ORDER } from "@/features/pipelines/constants";
import { PhaseType, Priority, TaskStatus } from "@/generated/prisma/enums";

export type TaskFormInitial = {
  id?: string;
  title: string;
  assigneeId: string;
  dueAt: string;
  priority: Priority;
  status: TaskStatus;
  businessId: string;
  pipelineId: string;
  phaseType: "" | PhaseType;
  notes: string;
};

const EMPTY: TaskFormInitial = {
  title: "",
  assigneeId: "",
  dueAt: "",
  priority: Priority.MEDIUM,
  status: TaskStatus.TODO,
  businessId: "",
  pipelineId: "",
  phaseType: "",
  notes: "",
};

const NONE = "NONE";

export function TaskForm({
  mode,
  options,
  initial = EMPTY,
  onSuccess,
}: {
  mode: "create" | "edit";
  options: TaskOptions;
  initial?: TaskFormInitial;
  onSuccess?: () => void;
}) {
  const [form, setForm] = useState<TaskFormInitial>(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof TaskFormInitial>(key: K, value: TaskFormInitial[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const payload = {
        title: form.title,
        assigneeId: form.assigneeId,
        dueAt: form.dueAt,
        priority: form.priority,
        businessId: form.businessId,
        pipelineId: form.pipelineId,
        phaseType: form.phaseType,
        notes: form.notes,
      };
      const result =
        mode === "create"
          ? await createTaskAction(payload)
          : await updateTaskAction({ ...payload, id: initial.id, status: form.status });

      if (result.ok) {
        toast.success(mode === "create" ? "Task created" : "Task updated");
        onSuccess?.();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="task-title">Title</Label>
        <Input id="task-title" value={form.title} onChange={(e) => set("title", e.target.value)} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="task-assignee">Assigned to</Label>
          <Select
            value={form.assigneeId || NONE}
            onValueChange={(v) => set("assigneeId", v === NONE ? "" : v)}
          >
            <SelectTrigger id="task-assignee">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Unassigned</SelectItem>
              {options.members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="task-due">Due</Label>
          <Input
            id="task-due"
            type="datetime-local"
            value={form.dueAt}
            onChange={(e) => set("dueAt", e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="task-priority">Priority</Label>
          <Select value={form.priority} onValueChange={(v) => set("priority", v as Priority)}>
            <SelectTrigger id="task-priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_ORDER.map((p) => (
                <SelectItem key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {mode === "edit" ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="task-status">Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v as TaskStatus)}>
              <SelectTrigger id="task-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_STATUS_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {TASK_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="task-business">Business</Label>
          <Select
            value={form.businessId || NONE}
            onValueChange={(v) => set("businessId", v === NONE ? "" : v)}
          >
            <SelectTrigger id="task-business">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>None</SelectItem>
              {options.businesses.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="task-pipeline">Pipeline</Label>
          <Select
            value={form.pipelineId || NONE}
            onValueChange={(v) => set("pipelineId", v === NONE ? "" : v)}
          >
            <SelectTrigger id="task-pipeline">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>None</SelectItem>
              {options.pipelines.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="task-phase">Phase</Label>
          <Select
            value={form.phaseType || NONE}
            onValueChange={(v) => set("phaseType", v === NONE ? "" : (v as PhaseType))}
          >
            <SelectTrigger id="task-phase">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>None</SelectItem>
              {PHASE_ORDER.map((p) => (
                <SelectItem key={p} value={p}>
                  {PHASE_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="task-notes">Notes</Label>
        <Textarea id="task-notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2Icon className="size-4 animate-spin" /> : null}
          {mode === "create" ? "Create To-Do" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
