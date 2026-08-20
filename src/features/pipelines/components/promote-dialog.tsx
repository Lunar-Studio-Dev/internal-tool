"use client";

import { useState } from "react";
import { ArrowRightIcon, Loader2Icon } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { usePromotePipeline } from "@/features/pipelines/api";
import { promotePipelineSchema } from "@/features/pipelines/schemas/pipeline.schema";
import { PHASE_LABELS } from "@/features/pipelines/constants";
import { mutationErrorMessage } from "@/lib/api/errors";
import { parseForm, type FieldErrors } from "@/lib/form";
import type { PhaseType } from "@/generated/prisma/enums";

export function PromoteDialog({
  pipelineId,
  nextPhase,
  size = "default",
  className,
}: {
  pipelineId: string;
  nextPhase: PhaseType;
  size?: "default" | "sm";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const promote = usePromotePipeline();

  async function submit() {
    setError(null);
    const parsed = parseForm(promotePipelineSchema, { pipelineId, notes });
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    try {
      await promote.mutateAsync(parsed.data);
      toast.success("Pipeline promoted");
      setOpen(false);
      setNotes("");
    } catch (err) {
      setError(mutationErrorMessage(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={size} className={className}>
          <ArrowRightIcon className="size-4" />
          Promote to {PHASE_LABELS[nextPhase]}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Promote to {PHASE_LABELS[nextPhase]}</DialogTitle>
          <DialogDescription>
            Optional notes are stored on the current phase before it is closed.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="promote-notes">Notes</FieldLabel>
            <Textarea
              id="promote-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={1000}
            />
            <FieldError error={errors.notes} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={promote.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={promote.isPending}>
            {promote.isPending ? <Loader2Icon className="size-4 animate-spin" /> : null}
            Promote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
