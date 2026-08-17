import type { LucideIcon } from "lucide-react";
import { CheckIcon, ConstructionIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Full-page placeholder for modules that are scoped but not yet built.
 * Communicates intent (what the module will do) rather than showing a blank screen.
 */
export function ComingSoon({
  icon: Icon,
  title,
  description,
  features,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  features?: string[];
}) {
  return (
    <Card className="mx-auto w-full max-w-2xl border-dashed">
      <CardHeader className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-7" />
        </div>
        <Badge variant="secondary" className="gap-1">
          <ConstructionIcon className="size-3" />
          Launching soon
        </Badge>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">{description}</p>
        </div>
      </CardHeader>
      {features && features.length > 0 ? (
        <CardContent>
          <div className="mx-auto max-w-md rounded-lg border bg-muted/30 p-4">
            <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              What&apos;s coming
            </p>
            <ul className="flex flex-col gap-2">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}
