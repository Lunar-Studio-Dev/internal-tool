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
import { createFollowUpAction } from "@/features/followups/server/followups.actions";
import type { PhaseType } from "@/generated/prisma/enums";

const NONE = "NONE";

export function FollowUpForm({
  members,
  businessId,
  pipelineId,
  phaseType,
  onSuccess,
}: {
  members: { id: string; name: string }[];
  businessId?: string | null;
  pipelineId?: string | null;
  phaseType?: PhaseType | null;
  onSuccess?: () => void;
}) {
  const [reason, setReason] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createFollowUpAction({
        businessId: businessId ?? "",
        pipelineId: pipelineId ?? "",
        phaseType: phaseType ?? "",
        reason,
        dueAt,
        assigneeId,
        notes,
      });
      if (result.ok) {
        toast.success("Follow-up scheduled");
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
        <Label htmlFor="fu-reason">Reason</Label>
        <Input
          id="fu-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Client reviewing quotation"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fu-due">Due</Label>
          <Input
            id="fu-due"
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="fu-assignee">Assigned to</Label>
          <Select
            value={assigneeId || NONE}
            onValueChange={(v) => setAssigneeId(v === NONE ? "" : v)}
          >
            <SelectTrigger id="fu-assignee">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Unassigned</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="fu-notes">Notes</Label>
        <Textarea id="fu-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2Icon className="size-4 animate-spin" /> : null}
          Create Follow-up
        </Button>
      </div>
    </form>
  );
}
