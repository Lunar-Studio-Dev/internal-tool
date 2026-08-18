import { format } from "date-fns";
import { CreditCardIcon, FileTextIcon } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { PipelineStepper } from "@/components/common/pipeline-stepper";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FollowUpRow } from "@/features/followups/components/followup-list";
import { PipelineActions } from "@/features/pipelines/components/pipeline-actions";
import { PipelineActivityList } from "@/features/pipelines/components/pipeline-activity-list";
import { PhaseViewShell } from "@/features/pipelines/components/phase-view-shell";
import {
  PhaseWork,
  type PhaseWorkResource,
  type PhaseWorkTask,
} from "@/features/pipelines/components/phase-work";
import { LEAD_SOURCE_LABELS, PHASE_LABELS, PHASE_ORDER } from "@/features/pipelines/constants";
import type {
  PipelineActivityItem,
  PipelineDetail as PipelineDetailData,
} from "@/features/pipelines/server/pipelines.queries";
import type { ResourceOptions } from "@/features/resources/server/resources.queries";
import type { TaskOptions } from "@/features/tasks/server/tasks.queries";
import { PhaseType } from "@/generated/prisma/enums";

export function PipelineDetail({
  pipeline,
  activity,
  reasons,
  canWrite,
  phaseTasks,
  phaseResources,
  phaseFollowUps,
  members,
  taskOptions,
  resourceOptions,
  canTaskWrite,
  canResourceWrite,
}: {
  pipeline: PipelineDetailData;
  activity: PipelineActivityItem[];
  reasons: { id: string; label: string }[];
  canWrite: boolean;
  phaseTasks: PhaseWorkTask[];
  phaseResources: PhaseWorkResource[];
  phaseFollowUps: FollowUpRow[];
  members: { id: string; name: string }[];
  taskOptions: TaskOptions | null;
  resourceOptions: ResourceOptions | null;
  canTaskWrite: boolean;
  canResourceWrite: boolean;
}) {
  const deactivated = pipeline.status === "DEACTIVATED";
  const phaseByType = new Map(pipeline.phases.map((p) => [p.type, p]));
  const current = phaseByType.get(pipeline.currentPhase) ?? null;

  return (
    <>
      <PageHeader
        title={`${pipeline.business.name} · ${pipeline.name}`}
        description={pipeline.code}
        breadcrumbs={[{ label: "Pipelines", href: "/pipelines" }, { label: pipeline.code }]}
        action={<StatusBadge kind={pipeline.status} />}
      />

      <div className="flex flex-col gap-5">
        <div className="text-sm text-muted-foreground">
          Owner: <span className="text-foreground">{pipeline.ownerName ?? "Unassigned"}</span> ·
          Lead source:{" "}
          <span className="text-foreground">{LEAD_SOURCE_LABELS[pipeline.leadSource]}</span>
        </div>

        <PipelineStepper
          steps={PHASE_ORDER.map((p) => PHASE_LABELS[p])}
          currentStep={PHASE_ORDER.indexOf(pipeline.currentPhase)}
          deactivated={deactivated}
        />

        <Tabs defaultValue="overview" className="gap-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="phases">Phases</TabsTrigger>
            <TabsTrigger value="quotation">Quotation</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex flex-col gap-4">
            {deactivated ? (
              <Card className="border-destructive/40">
                <CardHeader>
                  <CardTitle className="text-base">Deactivated</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Reason</span>
                    <span>{pipeline.reasonLabel ?? "—"}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">By</span>
                    <span>{pipeline.deactivatedByName ?? "—"}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">On</span>
                    <span>
                      {pipeline.deactivatedAt ? format(pipeline.deactivatedAt, "d MMM yyyy") : "—"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <PhaseViewShell
              phaseLabel={PHASE_LABELS[pipeline.currentPhase]}
              phaseStatus={current?.status ?? null}
              startedAt={current?.startedAt ?? null}
              ownerName={pipeline.ownerName}
              notes={current?.notes ?? pipeline.notes}
              work={
                <PhaseWork
                  businessId={pipeline.businessId}
                  pipelineId={pipeline.id}
                  phaseType={pipeline.currentPhase}
                  tasks={phaseTasks}
                  resources={phaseResources}
                  followUps={phaseFollowUps}
                  members={members}
                  taskOptions={taskOptions}
                  resourceOptions={resourceOptions}
                  canTaskWrite={canTaskWrite}
                  canResourceWrite={canResourceWrite}
                />
              }
              actions={
                <PipelineActions
                  pipelineId={pipeline.id}
                  status={pipeline.status}
                  currentPhase={pipeline.currentPhase}
                  canWrite={canWrite}
                  reasons={reasons}
                />
              }
            />
          </TabsContent>

          <TabsContent value="phases">
            <div className="flex flex-col divide-y rounded-lg border">
              {PHASE_ORDER.map((type) => {
                const row = phaseByType.get(type);
                const isContactInfo = type === PhaseType.CONTACT_INFO;
                return (
                  <div key={type} className="flex items-center justify-between gap-2 p-3 text-sm">
                    <span className={row ? "font-medium" : "text-muted-foreground"}>
                      {PHASE_LABELS[type]}
                    </span>
                    {row ? (
                      <StatusBadge kind={row.status} />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {isContactInfo ? "Informational" : "Upcoming"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="quotation">
            <EmptyState
              icon={FileTextIcon}
              title="No quotation yet"
              description="Quotations arrive in a later phase."
            />
          </TabsContent>
          <TabsContent value="payments">
            <EmptyState
              icon={CreditCardIcon}
              title="No payments yet"
              description="Payments arrive in a later phase."
            />
          </TabsContent>

          <TabsContent value="activity">
            <PipelineActivityList items={activity} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
