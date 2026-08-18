"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ArrowRightIcon, Loader2Icon, OctagonXIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DeactivateDialog,
  type DeactivationReasonOption,
} from "@/features/pipelines/components/deactivate-dialog";
import { PHASE_LABELS, nextPhase } from "@/features/pipelines/constants";
import { promotePipelineAction } from "@/features/pipelines/server/pipelines.actions";
import { PhaseType, PipelineStatus } from "@/generated/prisma/enums";

export function PipelineActions({
  pipelineId,
  status,
  currentPhase,
  canWrite,
  reasons,
}: {
  pipelineId: string;
  status: PipelineStatus;
  currentPhase: PhaseType;
  canWrite: boolean;
  reasons: DeactivationReasonOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // No transitions unless the caller can write and the pipeline is active.
  if (!canWrite || status !== PipelineStatus.ACTIVE) return null;

  const next = nextPhase(currentPhase);
  const paymentGated =
    currentPhase === PhaseType.QUOTATION && next === PhaseType.PROJECT_MANAGEMENT;

  function promote() {
    startTransition(async () => {
      const result = await promotePipelineAction({ pipelineId });
      if (result.ok) toast.success("Pipeline promoted");
      else toast.error(result.error);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <DeactivateDialog
        pipelineId={pipelineId}
        reasons={reasons}
        trigger={
          <Button variant="outline" disabled={isPending}>
            <OctagonXIcon className="size-4" />
            Deactivate
          </Button>
        }
      />
      {next && !paymentGated ? (
        <Button onClick={promote} disabled={isPending}>
          {isPending ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <ArrowRightIcon className="size-4" />
          )}
          Promote to {PHASE_LABELS[next]}
        </Button>
      ) : paymentGated ? (
        <Button disabled title="Gated by payment — coming in a later phase">
          Promote to {PHASE_LABELS[PhaseType.PROJECT_MANAGEMENT]} (payment-gated)
        </Button>
      ) : (
        <span className="text-sm text-muted-foreground">Final phase reached</span>
      )}
    </div>
  );
}
