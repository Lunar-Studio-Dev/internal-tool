"use client";

import { useState } from "react";
import { CheckIcon, Loader2Icon, PencilIcon, UserIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { FieldError, FieldLabel } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCancelTask, useCompleteTask, useReassignTask } from "@/features/tasks/api";
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog";
import type { TaskFormInitial } from "@/features/tasks/components/task-form";
import { reassignTaskSchema } from "@/features/tasks/schemas/task.schema";
import type { TaskOptions } from "@/features/tasks/server/tasks.queries";
import { mutationErrorMessage } from "@/lib/api/errors";
import { parseForm, type FieldErrors } from "@/lib/form";
import type { TaskStatus } from "@/generated/prisma/enums";

function ReassignDialog({
  taskId,
  currentAssigneeId,
  members,
}: {
  taskId: string;
  currentAssigneeId: string | null;
  members: TaskOptions["members"];
}) {
  const [open, setOpen] = useState(false);
  const [assigneeId, setAssigneeId] = useState(currentAssigneeId ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const reassign = useReassignTask();

  async function save() {
    const parsed = parseForm(reassignTaskSchema, { id: taskId, assigneeId });
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    try {
      await reassign.mutateAsync(parsed.data);
      toast.success("Task reassigned");
      setOpen(false);
    } catch (error) {
      toast.error(mutationErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserIcon className="size-4" />
          Reassign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reassign task</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="reassign-to" required>
            Assign to
          </FieldLabel>
          <Select value={assigneeId} onValueChange={setAssigneeId}>
            <SelectTrigger id="reassign-to">
              <SelectValue placeholder="Select a member" />
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError error={errors.assigneeId} />
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={reassign.isPending}>
            {reassign.isPending ? <Loader2Icon className="size-4 animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TaskDetailActions({
  taskId,
  status,
  assigneeId,
  initial,
  options,
}: {
  taskId: string;
  status: TaskStatus;
  assigneeId: string | null;
  initial: TaskFormInitial;
  options: TaskOptions;
}) {
  const completeTask = useCompleteTask();
  const cancelTask = useCancelTask();
  const isPending = completeTask.isPending || cancelTask.isPending;
  const done = status === "COMPLETED" || status === "CANCELLED";

  return (
    <div className="flex flex-wrap gap-2">
      {!done ? (
        <Button
          disabled={isPending}
          onClick={() =>
            completeTask.mutate(taskId, {
              onSuccess: () => toast.success("Task completed"),
              onError: (error) => toast.error(mutationErrorMessage(error)),
            })
          }
        >
          <CheckIcon className="size-4" />
          Mark Complete
        </Button>
      ) : null}
      <TaskFormDialog
        mode="edit"
        options={options}
        initial={initial}
        trigger={
          <Button variant="outline">
            <PencilIcon className="size-4" />
            Edit
          </Button>
        }
      />
      <ReassignDialog taskId={taskId} currentAssigneeId={assigneeId} members={options.members} />
      {!done ? (
        <Button
          variant="outline"
          disabled={isPending}
          onClick={() =>
            cancelTask.mutate(taskId, {
              onSuccess: () => toast.success("Task cancelled"),
              onError: (error) => toast.error(mutationErrorMessage(error)),
            })
          }
        >
          <XIcon className="size-4" />
          Cancel
        </Button>
      ) : null}
    </div>
  );
}
