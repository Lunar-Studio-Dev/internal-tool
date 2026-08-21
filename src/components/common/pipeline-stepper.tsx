"use client";

import { format } from "date-fns";
import { CheckIcon } from "lucide-react";

import { StatusBadge } from "@/components/common/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/**
 * The operational pipeline phases (Business Contact Info is business-level, not a
 * pipeline phase). Configurable via the `steps` prop; this is the default.
 */
export const PIPELINE_PHASES = [
  "Discovery",
  "Business Understanding",
  "Requirement",
  "Quotation",
  "Project Management",
] as const;

type StepState = "completed" | "current" | "upcoming" | "deactivated";

function clampStep(currentStep: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(Math.max(currentStep, 0), total - 1);
}

function stateFor(
  index: number,
  currentStep: number,
  deactivated: boolean,
  handedOff: boolean,
  completed: boolean,
): StepState {
  if (completed) return "completed";
  if (index < currentStep) return "completed";
  if (index === currentStep) {
    if (deactivated) return "deactivated";
    if (handedOff) return "completed";
    return "current";
  }
  return "upcoming";
}

function stepperBadgeKind(
  deactivated: boolean,
  completed: boolean,
  paymentPending: boolean,
): "DEACTIVATED" | "COMPLETED" | "PENDING" | "ACTIVE" {
  if (deactivated) return "DEACTIVATED";
  if (completed) return "COMPLETED";
  if (paymentPending) return "PENDING";
  return "ACTIVE";
}

function progressValue(currentStep: number, total: number): number {
  if (total <= 0) return 0;
  return ((currentStep + 1) / total) * 100;
}

function StepIndicator({
  state,
  index,
  size = "md",
}: {
  state: StepState;
  index: number;
  size?: "sm" | "md";
}) {
  const dimension = size === "sm" ? "size-5 text-[10px]" : "size-7 text-xs";
  const iconSize = size === "sm" ? "size-3" : "size-4";

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border font-medium",
        dimension,
        state === "completed" && "border-transparent bg-primary text-primary-foreground",
        state === "current" && "border-primary text-primary",
        state === "upcoming" && "border-border text-muted-foreground",
        state === "deactivated" && "border-transparent bg-destructive text-white",
      )}
      aria-hidden
    >
      {state === "completed" ? <CheckIcon className={iconSize} /> : index + 1}
    </span>
  );
}

function PipelinePhaseCard({
  steps,
  currentStep,
  deactivated,
  completed = false,
  handedOff = false,
  paymentPending = false,
  phaseStartedAt = null,
  reactivatedAt = null,
  className,
}: {
  steps: string[];
  currentStep: number;
  deactivated: boolean;
  completed?: boolean;
  handedOff?: boolean;
  paymentPending?: boolean;
  phaseStartedAt?: Date | null;
  /** Latest reactivation date; shown instead of started when set. */
  reactivatedAt?: Date | null;
  className?: string;
}) {
  if (steps.length === 0) return null;

  const currentLabel = steps[currentStep] ?? "";
  const progress = completed ? 100 : progressValue(currentStep, steps.length);
  const badgeKind = stepperBadgeKind(deactivated, completed, paymentPending);

  return (
    <Card className={className}>
      <CardContent className="flex flex-col gap-4">
        <div
          role="status"
          aria-label={`Pipeline phase ${currentStep + 1} of ${steps.length}: ${currentLabel}${deactivated ? ", deactivated" : completed ? ", completed" : ""}`}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Current phase</p>
              <p className="text-xl font-semibold leading-snug break-words">{currentLabel}</p>
              {reactivatedAt ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Reactivated {format(reactivatedAt, "d MMM yyyy")}
                </p>
              ) : phaseStartedAt ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Started {format(phaseStartedAt, "d MMM yyyy")}
                </p>
              ) : null}
              {paymentPending ? (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  Payment pending — awaiting initial payment
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span className="text-xs text-muted-foreground">
                Phase {currentStep + 1} of {steps.length}
              </span>
              <StatusBadge kind={badgeKind} />
            </div>
          </div>

          <Progress
            value={progress}
            className={cn(deactivated && "[&_[data-slot=progress-indicator]]:bg-destructive")}
          />

          <ol className="flex items-center justify-between gap-1 md:hidden" aria-label="Pipeline phases">
            {steps.map((label, index) => {
              const state = stateFor(index, currentStep, deactivated, handedOff, completed);
              return (
                <li key={label} aria-label={`${label}: ${state}`}>
                  <StepIndicator state={state} index={index} size="sm" />
                </li>
              );
            })}
          </ol>

          <ol className="hidden w-full items-center md:flex" aria-label="Pipeline phases">
            {steps.map((label, index) => {
              const state = stateFor(index, currentStep, deactivated, handedOff, completed);
              const isLast = index === steps.length - 1;
              const isCurrent = state === "current";

              return (
                <li key={label} className="flex min-w-0 items-center">
                  <div className="flex min-w-0 items-center gap-2">
                    <StepIndicator state={state} index={index} size="md" />
                    <span
                      className={cn(
                        "truncate text-sm",
                        state === "upcoming" && "text-muted-foreground",
                        isCurrent && "font-semibold text-foreground",
                        !isCurrent && state === "completed" && "font-medium",
                      )}
                    >
                      {label}
                    </span>
                  </div>
                  {!isLast ? (
                    <span
                      className={cn(
                        "mx-2 h-px min-w-4 flex-1",
                        index < currentStep || completed ? "bg-primary" : "bg-border",
                      )}
                      aria-hidden
                    />
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

export function PipelineStepper({
  steps = [...PIPELINE_PHASES],
  currentStep,
  deactivated = false,
  completed = false,
  handedOff = false,
  paymentPending = false,
  phaseStartedAt = null,
  reactivatedAt = null,
  className,
}: {
  steps?: string[];
  /** 0-based index of the active phase. */
  currentStep: number;
  /** When true, the current phase is rendered as deactivated (stopped). */
  deactivated?: boolean;
  /** When true, the pipeline is marked completed (won). */
  completed?: boolean;
  /** When true, the current (final) phase step is shown as completed. */
  handedOff?: boolean;
  paymentPending?: boolean;
  /** When the current pipeline phase started. */
  phaseStartedAt?: Date | null;
  /** Latest reactivation date; shown instead of started when set. */
  reactivatedAt?: Date | null;
  className?: string;
}) {
  const clamped = clampStep(currentStep, steps.length);

  if (steps.length === 0) return null;

  return (
    <PipelinePhaseCard
      steps={steps}
      currentStep={clamped}
      deactivated={deactivated}
      completed={completed}
      handedOff={handedOff}
      paymentPending={paymentPending}
      phaseStartedAt={phaseStartedAt}
      reactivatedAt={reactivatedAt}
      className={className}
    />
  );
}
