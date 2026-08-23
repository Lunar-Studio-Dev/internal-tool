"use client";

import { type FormEvent, useMemo, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import {
  BusinessCombobox,
  EnumCombobox,
  PipelineCombobox,
} from "@/components/common/combobox";
import type { ComboboxOption } from "@/components/common/combobox";
import { FieldError, FieldLabel } from "@/components/common/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTask, useUpdateTask } from "@/features/tasks/api";
import { PRIORITY_LABELS, PRIORITY_ORDER, TASK_STATUS_LABELS, TASK_STATUS_ORDER } from "@/features/tasks/constants";
import { createTaskSchema, updateTaskSchema } from "@/features/tasks/schemas/task.schema";
import type { TaskOptions } from "@/features/tasks/server/tasks.queries";
import { PHASE_LABELS, PHASE_ORDER } from "@/features/pipelines/constants";
import { mutationErrorMessage } from "@/lib/api/errors";
import { parseForm, type FieldErrors } from "@/lib/form";
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
  const [errors, setErrors] = useState<FieldErrors>({});
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const isPending = createTask.isPending || updateTask.isPending;

  const phaseOptions = useMemo(
    (): ComboboxOption[] =>
      PHASE_ORDER.map((phase) => ({
        value: phase,
        label: PHASE_LABELS[phase],
      })),
    [],
  );

  function set<K extends keyof TaskFormInitial>(key: K, value: TaskFormInitial[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
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
    setErrors({});
    try {
      if (mode === "create") {
        const parsed = parseForm(createTaskSchema, payload);
        if (!parsed.ok) {
          setErrors(parsed.errors);
          return;
        }
        await createTask.mutateAsync(parsed.data);
      } else {
        const parsed = parseForm(updateTaskSchema, {
          ...payload,
          id: initial.id,
          status: form.status,
        });
        if (!parsed.ok) {
          setErrors(parsed.errors);
          return;
        }
        await updateTask.mutateAsync(parsed.data);
      }
      toast.success(mode === "create" ? "Task created" : "Task updated");
      onSuccess?.();
    } catch (error) {
      setError(mutationErrorMessage(error));
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor="task-title" required>
          Title
        </FieldLabel>
        <Input
          id="task-title"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          maxLength={200}
        />
        <FieldError error={errors.title} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="task-assignee">Assigned to</FieldLabel>
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
          <FieldError error={errors.assigneeId} />
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="task-due">Due</FieldLabel>
          <Input
            id="task-due"
            type="datetime-local"
            value={form.dueAt}
            onChange={(e) => set("dueAt", e.target.value)}
          />
          <FieldError error={errors.dueAt} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="task-priority" required>
            Priority
          </FieldLabel>
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
          <FieldError error={errors.priority} />
        </div>
        {mode === "edit" ? (
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="task-status" required>
              Status
            </FieldLabel>
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
            <FieldError error={errors.status} />
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="task-business">Business</FieldLabel>
          <BusinessCombobox
            id="task-business"
            options={options.businesses}
            value={form.businessId || null}
            allowClear
            clearValue={NONE}
            placeholder="None"
            onChange={(v) => set("businessId", v === NONE ? "" : v)}
          />
          <FieldError error={errors.businessId} />
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="task-pipeline">Pipeline</FieldLabel>
          <PipelineCombobox
            id="task-pipeline"
            options={options.pipelines.map((p) => ({ id: p.id, label: p.label }))}
            value={form.pipelineId || NONE}
            allowClear
            clearValue={NONE}
            placeholder="None"
            onChange={(v) => set("pipelineId", v === NONE ? "" : v)}
          />
          <FieldError error={errors.pipelineId} />
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="task-phase">Phase</FieldLabel>
          <EnumCombobox
            id="task-phase"
            options={phaseOptions}
            value={form.phaseType || NONE}
            allowClear
            clearValue={NONE}
            searchable={false}
            placeholder="None"
            onChange={(v) => set("phaseType", v === NONE ? "" : (v as PhaseType))}
          />
          <FieldError error={errors.phaseType} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor="task-notes">Notes</FieldLabel>
        <Textarea
          id="task-notes"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          maxLength={2000}
        />
        <FieldError error={errors.notes} />
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
