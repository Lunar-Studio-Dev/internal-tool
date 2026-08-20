"use client";

import { OctagonXIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DeactivateDialog,
  type DeactivationReasonOption,
} from "@/features/pipelines/components/deactivate-dialog";
import { PromoteDialog } from "@/features/pipelines/components/promote-dialog";
import { PHASE_LABELS, nextPhase } from "@/features/pipelines/constants";
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
  if (!canWrite || status !== PipelineStatus.ACTIVE) return null;

  const next = nextPhase(currentPhase);
  const paymentGated =
    currentPhase === PhaseType.QUOTATION && next === PhaseType.PROJECT_MANAGEMENT;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <DeactivateDialog
        pipelineId={pipelineId}
        reasons={reasons}
        trigger={
          <Button variant="outline">
            <OctagonXIcon className="size-4" />
            Deactivate
          </Button>
        }
      />
      {next && !paymentGated ? (
        <PromoteDialog pipelineId={pipelineId} nextPhase={next} />
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
