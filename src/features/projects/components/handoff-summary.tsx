"use client";

import Link from "next/link";
import { format } from "date-fns";
import { FolderKanbanIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { InfoRow } from "@/components/common/info-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/features/phases/constants";
import { HandoffChecklistView } from "@/features/projects/components/handoff-checklist";
import type { ProjectSetupDto } from "@/features/projects/api";

export function HandoffSummary({
  context,
  pipelineHref,
}: {
  context: ProjectSetupDto;
  pipelineHref: string;
}) {
  const project = context.project;
  if (!project) {
    return (
      <EmptyState
        icon={FolderKanbanIcon}
        title="No project yet"
        description="Create the project handoff to assemble the delivery package."
      />
    );
  }

  const primary = project.snapshot.business.primaryContact;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Handed over to development</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2 rounded-lg border p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Business
            </p>
            <InfoRow label="Name" value={project.snapshot.business.name} />
            <InfoRow
              label="Contact"
              value={
                primary
                  ? `${primary.name}${primary.email ? ` · ${primary.email}` : ""}`
                  : project.snapshot.business.email
              }
            />
          </div>
          <div className="flex flex-col gap-2 rounded-lg border p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Project
            </p>
            <InfoRow label="Name" value={project.name} />
            <InfoRow label="Code" value={project.code} />
            <InfoRow label="Manager" value={project.managerName} />
            <InfoRow
              label="Timeline"
              value={
                project.startDate || project.deadline
                  ? [
                      project.startDate ? format(new Date(project.startDate), "d MMM yyyy") : "—",
                      project.deadline ? format(new Date(project.deadline), "d MMM yyyy") : "—",
                    ].join(" → ")
                  : null
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Handoff package</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <HandoffChecklistView checklist={project.checklist} />
          {project.snapshot.quotation ? (
            <p className="text-sm text-muted-foreground">
              Quotation V{project.snapshot.quotation.version} ·{" "}
              {formatINR(project.snapshot.quotation.subtotal)} · Received{" "}
              {formatINR(project.snapshot.payment.receivedPaise)}
              {project.snapshot.payment.fullyPaid ? " · Fully paid" : " · Balance outstanding"}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={pipelineHref}>View pipeline</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
