"use client";

import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { CreditCardIcon, FileTextIcon } from "lucide-react";

import { ActivityList } from "@/components/common/activity-list";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { PipelineStepper } from "@/components/common/pipeline-stepper";
import { QueryGate } from "@/components/common/query-gate";
import { StatusBadge } from "@/components/common/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SectionTabs,
  SectionTabsList,
  SectionTabsTrigger,
} from "@/components/common/section-tabs";
import { TabsContent } from "@/components/ui/tabs";
import { pipelineQueries } from "@/features/pipelines/api";
import { PipelineActions } from "@/features/pipelines/components/pipeline-actions";
import { PhaseViewShell } from "@/features/pipelines/components/phase-view-shell";
import { PhaseWork } from "@/features/pipelines/components/phase-work";
import {
  LEAD_SOURCE_LABELS,
  PHASE_LABELS,
  PHASE_ORDER,
  WORKABLE_PHASES,
} from "@/features/pipelines/constants";
import { useCan } from "@/features/team/hooks/use-current-member";
import { PhaseType } from "@/generated/prisma/enums";

export function PipelineDetail({ id }: { id: string }) {
  const pipelineQuery = useQuery(pipelineQueries.detail(id));
  const activityQuery = useQuery(pipelineQueries.activity(id));
  const reasonsQuery = useQuery(pipelineQueries.reasons());
  const tasksQuery = useQuery(pipelineQueries.tasks(id));
  const resourcesQuery = useQuery(pipelineQueries.resources(id));
  const followUpsQuery = useQuery(pipelineQueries.followUps(id));
  const canWrite = useCan("pipeline:write");
  const canTaskWrite = useCan("task:write");
  const canResourceWrite = useCan("resource:write");
  const pipeline = pipelineQuery.data;

  const deactivated = pipeline?.status === "DEACTIVATED";
  const phaseByType = new Map(pipeline?.phases.map((p) => [p.type, p]) ?? []);
  const current = pipeline ? (phaseByType.get(pipeline.currentPhase) ?? null) : null;
  const stepperIndex = pipeline
    ? Math.max(0, WORKABLE_PHASES.indexOf(pipeline.currentPhase))
    : 0;

  return (
    <QueryGate
      isPending={pipelineQuery.isPending}
      isError={pipelineQuery.isError}
      error={pipelineQuery.error}
    >
      {pipeline ? (
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
              steps={WORKABLE_PHASES.map((p) => PHASE_LABELS[p])}
              currentStep={stepperIndex}
              deactivated={deactivated}
            />

            <SectionTabs defaultValue="overview" className="gap-4">
              <SectionTabsList>
                <SectionTabsTrigger value="overview">Overview</SectionTabsTrigger>
                <SectionTabsTrigger value="phases">Phases</SectionTabsTrigger>
                <SectionTabsTrigger value="quotation">Quotation</SectionTabsTrigger>
                <SectionTabsTrigger value="payments">Payments</SectionTabsTrigger>
                <SectionTabsTrigger value="activity">Activity</SectionTabsTrigger>
              </SectionTabsList>

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
                          {pipeline.deactivatedAt
                            ? format(new Date(pipeline.deactivatedAt), "d MMM yyyy")
                            : "—"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                <PhaseViewShell
                  phaseLabel={PHASE_LABELS[pipeline.currentPhase]}
                  phaseStatus={current?.status ?? null}
                  startedAt={current?.startedAt ? new Date(current.startedAt) : null}
                  ownerName={pipeline.ownerName}
                  notes={current?.notes ?? pipeline.notes}
                  work={
                    <PhaseWork
                      businessId={pipeline.businessId}
                      pipelineId={pipeline.id}
                      phaseType={pipeline.currentPhase}
                      tasks={(tasksQuery.data ?? []).map((t) => ({
                        id: t.id,
                        title: t.title,
                        status: t.status,
                        dueAt: t.dueAt,
                      }))}
                      resources={(resourcesQuery.data ?? []).map((r) => ({
                        id: r.id,
                        name: r.name,
                        type: r.type,
                        contentType: r.contentType,
                      }))}
                      followUps={(followUpsQuery.data ?? []).map((f) => ({
                        id: f.id,
                        reason: f.reason,
                        dueAt: f.dueAt,
                        completedAt: f.completedAt,
                        assigneeName: f.assigneeName,
                        notes: f.notes,
                      }))}
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
                      reasons={(reasonsQuery.data ?? []).map((r) => ({ id: r.id, label: r.label }))}
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
                <ActivityList items={activityQuery.data ?? []} />
              </TabsContent>
            </SectionTabs>
          </div>
        </>
      ) : null}
    </QueryGate>
  );
}
