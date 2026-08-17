import { CheckIcon } from "lucide-react";

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
  function stateFor(index: number): StepState {
    if (index < currentStep) return "completed";
    if (index === currentStep) return deactivated ? "deactivated" : "current";
    return "upcoming";
  }

  return (
    <ol className={cn("flex w-full flex-wrap items-center gap-y-3", className)}>
      {steps.map((label, index) => {
        const state = stateFor(index);
        const isLast = index === steps.length - 1;
        return (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                  state === "completed" && "border-transparent bg-primary text-primary-foreground",
                  state === "current" && "border-primary text-primary",
                  state === "upcoming" && "border-border text-muted-foreground",
                  state === "deactivated" && "border-transparent bg-destructive text-white",
                )}
              >
                {state === "completed" ? <CheckIcon className="size-4" /> : index + 1}
              </span>
              <span
                className={cn(
                  "truncate text-sm",
                  state === "upcoming" ? "text-muted-foreground" : "font-medium",
                )}
              >
                {label}
              </span>
            </div>
            {!isLast ? (
              <span
                className={cn(
                  "mx-1 h-px flex-1",
                  index < currentStep ? "bg-primary" : "bg-border",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
