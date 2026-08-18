"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckIcon, Loader2Icon, PencilIcon, UserIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog";
import type { TaskFormInitial } from "@/features/tasks/components/task-form";
import {
  cancelTaskAction,
  completeTaskAction,
  reassignTaskAction,
} from "@/features/tasks/server/tasks.actions";
import type { TaskOptions } from "@/features/tasks/server/tasks.queries";
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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [assigneeId, setAssigneeId] = useState(currentAssigneeId ?? "");
  const [isPending, startTransition] = useTransition();

  function save() {
    if (!assigneeId) {
      toast.error("Select an assignee");
      return;
    }
    startTransition(async () => {
      const result = await reassignTaskAction({ id: taskId, assigneeId });
      if (result.ok) {
        toast.success("Task reassigned");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
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
          <Label htmlFor="reassign-to">Assign to</Label>
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
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={isPending}>
            {isPending ? <Loader2Icon className="size-4 animate-spin" /> : null}
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const done = status === "COMPLETED" || status === "CANCELLED";

  function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>, success: string) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(success);
      else toast.error(result.error);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {!done ? (
        <Button disabled={isPending} onClick={() => run(() => completeTaskAction(taskId), "Task completed")}>
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
          onClick={() => run(() => cancelTaskAction(taskId), "Task cancelled")}
        >
          <XIcon className="size-4" />
          Cancel
        </Button>
      ) : null}
    </div>
  );
}
