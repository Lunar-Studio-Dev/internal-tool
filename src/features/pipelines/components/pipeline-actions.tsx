"use client";

import { CheckCircle2Icon, OctagonXIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CompletePipelineDialog } from "@/features/pipelines/components/complete-pipeline-dialog";
import {
  DeactivateDialog,
  type DeactivationReasonOption,
} from "@/features/pipelines/components/deactivate-dialog";
import { PromoteDialog } from "@/features/pipelines/components/promote-dialog";
import {
  PHASE_LABELS,
  canCompletePipeline,
  isFinalPhase,
  isPipelineDeactivationLocked,
  nextPhase,
} from "@/features/pipelines/constants";
import { PhaseType, PipelineStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

export function PipelineActions({
  pipelineId,
  status,
  currentPhase,
  handedOff,
  canWrite,
  reasons,
  compact = false,
  className,
}: {
  pipelineId: string;
  status: PipelineStatus;
  currentPhase: PhaseType;
  handedOff: boolean;
  canWrite: boolean;
  reasons: DeactivationReasonOption[];
  compact?: boolean;
  className?: string;
}) {
  if (!canWrite || status !== PipelineStatus.ACTIVE) return null;

  const next = nextPhase(currentPhase);
  const paymentGated =
    currentPhase === PhaseType.QUOTATION && next === PhaseType.PROJECT_MANAGEMENT;
  const deactivationLocked = isPipelineDeactivationLocked({ currentPhase, handedOff });
  const completable = canCompletePipeline({ status, currentPhase, handedOff });
  const size = compact ? "sm" : "default";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        compact ? "justify-stretch sm:justify-end" : "justify-between",
        className,
      )}
    >
      {!deactivationLocked ? (
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
      ) : null}
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
          title="Record the initial payment on the Payments tab to open Project Management"
        >
          {compact
            ? "Payment gated"
            : `Promote to ${PHASE_LABELS[PhaseType.PROJECT_MANAGEMENT]} (payment-gated)`}
        </Button>
      ) : completable ? (
        <CompletePipelineDialog
          pipelineId={pipelineId}
          trigger={
            <Button size={size} className={cn(compact && "flex-1 sm:flex-none")}>
              <CheckCircle2Icon className="size-4" />
              Complete
            </Button>
          }
        />
      ) : isFinalPhase(currentPhase) ? (
        <span className="text-sm text-muted-foreground">
          {handedOff ? "Ready to complete" : "Complete handover on Details to finish"}
        </span>
      ) : null}
    </div>
  );
}
