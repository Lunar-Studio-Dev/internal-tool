"use client";

import { type FormEvent, useMemo, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

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
import { useCreateFollowUp, useUpdateFollowUp } from "@/features/followups/api";
import { toDatetimeLocalValue } from "@/features/followups/datetime-local";
import { createFollowUpSchema, updateFollowUpSchema } from "@/features/followups/schemas/followup.schema";
import { mutationErrorMessage } from "@/lib/api/errors";
import { parseForm, type FieldErrors } from "@/lib/form";
import type { PhaseType } from "@/generated/prisma/enums";

const NONE = "NONE";

export type FollowUpFormInitial = {
  id: string;
  reason: string;
  dueAt: string;
  assigneeId: string | null;
  notes: string | null;
};

export function FollowUpForm({
  members,
  businessId,
  pipelineId,
  phaseType,
  followUp,
  onSuccess,
}: {
  members: { id: string; name: string }[];
  businessId?: string | null;
  pipelineId?: string | null;
  phaseType?: PhaseType | null;
  followUp?: FollowUpFormInitial;
  onSuccess?: () => void;
}) {
  const isEdit = Boolean(followUp);
  const initialDueAt = useMemo(
    () => (followUp ? toDatetimeLocalValue(followUp.dueAt) : ""),
    [followUp],
  );

  const [reason, setReason] = useState(followUp?.reason ?? "");
  const [dueAt, setDueAt] = useState(initialDueAt);
  const [assigneeId, setAssigneeId] = useState(followUp?.assigneeId ?? "");
  const [notes, setNotes] = useState(followUp?.notes ?? "");
  const [rescheduleNotes, setRescheduleNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const createFollowUp = useCreateFollowUp();
  const updateFollowUp = useUpdateFollowUp();
  const isPending = createFollowUp.isPending || updateFollowUp.isPending;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (isEdit && followUp) {
      const parsed = parseForm(updateFollowUpSchema, {
        reason,
        dueAt,
        assigneeId,
        notes,
        rescheduleNotes,
      });
      if (!parsed.ok) {
        setErrors(parsed.errors);
        return;
      }
      setErrors({});
      try {
        await updateFollowUp.mutateAsync({ id: followUp.id, input: parsed.data });
        toast.success(
          initialDueAt !== dueAt ? "Follow-up rescheduled" : "Follow-up updated",
        );
        onSuccess?.();
      } catch (err) {
        setError(mutationErrorMessage(err));
      }
      return;
    }

    const parsed = parseForm(createFollowUpSchema, {
      businessId: businessId ?? "",
      pipelineId: pipelineId ?? "",
      phaseType: phaseType ?? "",
      reason,
      dueAt,
      assigneeId,
      notes,
    });
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    try {
      await createFollowUp.mutateAsync(parsed.data);
      toast.success("Follow-up scheduled");
      onSuccess?.();
    } catch (err) {
      setError(mutationErrorMessage(err));
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
        <FieldLabel htmlFor="fu-reason" required>
          Reason
        </FieldLabel>
        <Input
          id="fu-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Client reviewing quotation"
          maxLength={200}
        />
        <FieldError error={errors.reason} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="fu-due" required>
            Due
          </FieldLabel>
          <Input
            id="fu-due"
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />
          <FieldError error={errors.dueAt} />
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="fu-assignee">Assigned to</FieldLabel>
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
          <FieldError error={errors.assigneeId} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor="fu-notes">Notes</FieldLabel>
        <Textarea
          id="fu-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={1000}
        />
        <FieldError error={errors.notes} />
      </div>

      {isEdit && initialDueAt !== dueAt ? (
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="fu-reschedule-notes">Reschedule note</FieldLabel>
          <Textarea
            id="fu-reschedule-notes"
            value={rescheduleNotes}
            onChange={(e) => setRescheduleNotes(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Why is this being moved? (optional)"
          />
          <FieldError error={errors.rescheduleNotes} />
        </div>
      ) : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2Icon className="size-4 animate-spin" /> : null}
          {isEdit ? "Save changes" : "Create follow-up"}
        </Button>
      </div>
    </form>
  );
}
