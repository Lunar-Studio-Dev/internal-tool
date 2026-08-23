"use client";

import { type ReactNode, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { FieldError, FieldLabel } from "@/components/common/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ReasonCombobox } from "@/components/common/combobox";
import { Textarea } from "@/components/ui/textarea";
import { useDeactivatePipeline } from "@/features/pipelines/api";
import { deactivatePipelineSchema } from "@/features/pipelines/schemas/pipeline.schema";
import { mutationErrorMessage } from "@/lib/api/errors";
import { parseForm, type FieldErrors } from "@/lib/form";

export type DeactivationReasonOption = { id: string; label: string };

export function DeactivateDialog({
  pipelineId,
  reasons,
  trigger,
}: {
  pipelineId: string;
  reasons: DeactivationReasonOption[];
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [reasonId, setReasonId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const deactivate = useDeactivatePipeline();
  const isPending = deactivate.isPending;

  async function onSubmit() {
    setError(null);
    const parsed = parseForm(deactivatePipelineSchema, { pipelineId, reasonId, notes });
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    try {
      await deactivate.mutateAsync(parsed.data);
      toast.success("Pipeline deactivated");
      setOpen(false);
    } catch (err) {
      setError(mutationErrorMessage(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deactivate pipeline</DialogTitle>
          <DialogDescription>
            The pipeline is preserved and can be reactivated later. The business stays active.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="deact-reason" required>
              Reason
            </FieldLabel>
            <ReasonCombobox
              id="deact-reason"
              options={reasons}
              value={reasonId}
              onChange={setReasonId}
              placeholder="Select a reason"
            />
            <FieldError error={errors.reasonId} />
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="deact-notes">Notes</FieldLabel>
            <Textarea
              id="deact-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={1000}
            />
            <FieldError error={errors.notes} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onSubmit} disabled={isPending}>
            {isPending ? <Loader2Icon className="size-4 animate-spin" /> : null}
            Deactivate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
