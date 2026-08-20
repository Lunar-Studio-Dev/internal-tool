"use client";

import { type ReactNode, useState } from "react";
import { CheckCircle2Icon, Loader2Icon } from "lucide-react";
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
import { useCompletePipeline } from "@/features/pipelines/api";
import { completePipelineSchema } from "@/features/pipelines/schemas/pipeline.schema";
import { mutationErrorMessage } from "@/lib/api/errors";
import { parseForm, type FieldErrors } from "@/lib/form";

export function CompletePipelineDialog({
  pipelineId,
  pipelineLabel,
  trigger,
}: {
  pipelineId: string;
  pipelineLabel?: string;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const complete = useCompletePipeline();
  const isPending = complete.isPending;

  async function onSubmit() {
    setError(null);
    const parsed = parseForm(completePipelineSchema, { pipelineId, notes });
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    try {
      await complete.mutateAsync(parsed.data);
      toast.success("Pipeline completed");
      setOpen(false);
      setNotes("");
    } catch (err) {
      setError(mutationErrorMessage(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete pipeline</DialogTitle>
          <DialogDescription>
            {pipelineLabel
              ? `Mark ${pipelineLabel} as successfully completed. History is preserved.`
              : "Mark this pipeline as successfully completed. All history is preserved."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="complete-notes">Notes</FieldLabel>
            <Textarea
              id="complete-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Optional closing notes…"
            />
            <FieldError error={errors.notes} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isPending}>
            {isPending ? <Loader2Icon className="size-4 animate-spin" /> : <CheckCircle2Icon className="size-4" />}
            Complete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
