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
import { cn } from "@/lib/utils";

export function PipelineActions({
  pipelineId,
  status,
  currentPhase,
  canWrite,
  reasons,
  compact = false,
  className,
}: {
  pipelineId: string;
  status: PipelineStatus;
  currentPhase: PhaseType;
  canWrite: boolean;
  reasons: DeactivationReasonOption[];
  compact?: boolean;
  className?: string;
}) {
  if (!canWrite || status !== PipelineStatus.ACTIVE) return null;

  const next = nextPhase(currentPhase);
  const paymentGated =
    currentPhase === PhaseType.QUOTATION && next === PhaseType.PROJECT_MANAGEMENT;
  const size = compact ? "sm" : "default";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        compact ? "justify-stretch sm:justify-end" : "justify-between",
        className,
      )}
    >
      <DeactivateDialog
        pipelineId={pipelineId}
        reasons={reasons}
        trigger={
          <Button variant="destructive" size={size} className={cn(compact && "flex-1 sm:flex-none")}>
            <OctagonXIcon className="size-4" />
            Deactivate
          </Button>
        }
      />
      {next && !paymentGated ? (
        <PromoteDialog
          pipelineId={pipelineId}
          nextPhase={next}
          size={size}
          className={cn(compact && "flex-1 sm:flex-none")}
        />
      ) : paymentGated ? (
        <Button
          disabled
          size={size}
          className={cn(compact && "flex-1 sm:flex-none")}
          title="Gated by payment — coming in a later phase"
        >
          {compact
            ? "Payment gated"
            : `Promote to ${PHASE_LABELS[PhaseType.PROJECT_MANAGEMENT]} (payment-gated)`}
        </Button>
      ) : (
        <span className="text-sm text-muted-foreground">Final phase reached</span>
      )}
    </div>
  );
}
