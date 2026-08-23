"use client";

import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Business info" },
  { id: 2, label: "Profile & contact" },
  { id: 3, label: "Source" },
] as const;

export function BusinessWizardStepIndicator({
  step,
  className,
}: {
  step: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-2">
        {STEPS.map((item, index) => (
          <div key={item.id} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                step === item.id
                  ? "bg-primary text-primary-foreground"
                  : step > item.id
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {item.id}
            </div>
            {index < STEPS.length - 1 ? (
              <div
                className={cn(
                  "h-px flex-1",
                  step > item.id ? "bg-primary/40" : "bg-border",
                )}
              />
            ) : null}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        {STEPS.map((item) => (
          <span
            key={item.id}
            className={cn(step === item.id && "font-medium text-foreground")}
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
