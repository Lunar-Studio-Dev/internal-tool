"use client";

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

function stateFor(index: number, currentStep: number, deactivated: boolean): StepState {
  if (index < currentStep) return "completed";
  if (index === currentStep) return deactivated ? "deactivated" : "current";
  return "upcoming";
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
  className,
}: {
  steps: string[];
  currentStep: number;
  deactivated: boolean;
  className?: string;
}) {
  if (steps.length === 0) return null;

  const currentLabel = steps[currentStep] ?? "";
  const progress = progressValue(currentStep, steps.length);

  return (
    <Card className={className}>
      <CardContent className="flex flex-col gap-3">
        <div
          role="status"
          aria-label={`Pipeline phase ${currentStep + 1} of ${steps.length}: ${currentLabel}${deactivated ? ", deactivated" : ""}`}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              Phase {currentStep + 1} of {steps.length}
            </span>
            <StatusBadge kind={deactivated ? "DEACTIVATED" : "ACTIVE"} />
          </div>
          <p className="text-lg font-semibold leading-snug break-words">{currentLabel}</p>
          <Progress
            value={progress}
            className={cn(deactivated && "[&_[data-slot=progress-indicator]]:bg-destructive")}
          />
          <ol className="flex items-center justify-between gap-1" aria-label="Pipeline phases">
            {steps.map((label, index) => {
              const state = stateFor(index, currentStep, deactivated);
              return (
                <li key={label} aria-label={`${label}: ${state}`}>
                  <StepIndicator state={state} index={index} size="sm" />
                </li>
              );
            })}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

function PipelineStepperDesktop({
  steps,
  currentStep,
  deactivated,
  className,
}: {
  steps: string[];
  currentStep: number;
  deactivated: boolean;
  className?: string;
}) {
  if (steps.length === 0) return null;

  return (
    <ol className={cn("flex w-full items-center", className)} aria-label="Pipeline phases">
      {steps.map((label, index) => {
        const state = stateFor(index, currentStep, deactivated);
        const isLast = index === steps.length - 1;
        const isCurrent = index === currentStep;

        return (
          <li key={label} className="flex items-center">
            <div className="flex items-center gap-2">
              <StepIndicator state={state} index={index} size="md" />
              <span
                className={cn(
                  "whitespace-nowrap text-sm",
                  state === "upcoming" && "text-muted-foreground",
                  isCurrent && "font-semibold",
                  !isCurrent && state !== "upcoming" && "font-medium",
                )}
              >
                {label}
              </span>
            </div>
            {!isLast ? (
              <span
                className={cn(
                  "mx-2 h-px min-w-8 flex-1",
                  index < currentStep ? "bg-primary" : "bg-border",
                )}
                aria-hidden
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export function PipelineStepper({
  steps = [...PIPELINE_PHASES],
  currentStep,
  deactivated = false,
  className,
}: {
  steps?: string[];
  /** 0-based index of the active phase. */
  currentStep: number;
  /** When true, the current phase is rendered as deactivated (stopped). */
  deactivated?: boolean;
  className?: string;
}) {
  const clamped = clampStep(currentStep, steps.length);

  if (steps.length === 0) return null;

  return (
    <div className={className}>
      <PipelinePhaseCard
        steps={steps}
        currentStep={clamped}
        deactivated={deactivated}
        className="md:hidden"
      />
      <PipelineStepperDesktop
        steps={steps}
        currentStep={clamped}
        deactivated={deactivated}
        className="hidden md:flex"
      />
    </div>
  );
}
