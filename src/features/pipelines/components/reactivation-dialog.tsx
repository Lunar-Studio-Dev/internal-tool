"use client";

import { type ReactNode, useState } from "react";
import { Loader2Icon, RotateCcwIcon } from "lucide-react";
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
import { useReactivatePipeline } from "@/features/pipelines/api";
import { reactivatePipelineSchema } from "@/features/pipelines/schemas/pipeline.schema";
import { mutationErrorMessage } from "@/lib/api/errors";
import { parseForm, type FieldErrors } from "@/lib/form";

export function ReactivationDialog({
  pipelineId,
  businessName,
  pipelineCode,
  resumePhaseLabel,
  trigger,
}: {
  pipelineId: string;
  businessName?: string;
  pipelineCode: string;
  resumePhaseLabel: string;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const reactivate = useReactivatePipeline();
  const isPending = reactivate.isPending;

  async function onSubmit() {
    setError(null);
    const parsed = parseForm(reactivatePipelineSchema, { pipelineId, notes });
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    try {
      await reactivate.mutateAsync(parsed.data);
      toast.success("Pipeline reactivated");
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
          <DialogTitle>Reactivate pipeline</DialogTitle>
          <DialogDescription>
            Resumes {businessName ? `${businessName} · ` : ""}
            {pipelineCode} at its previous phase. History is preserved.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <span className="text-muted-foreground">After reactivation: </span>
            <span className="font-medium">Deactivated → Active ({resumePhaseLabel})</span>
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="react-notes">Notes</FieldLabel>
            <Textarea
              id="react-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Optional context for why this pipeline is back…"
            />
            <FieldError error={errors.notes} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isPending}>
            {isPending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <RotateCcwIcon className="size-4" />
            )}
            Reactivate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
