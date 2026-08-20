"use client";

import { format } from "date-fns";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreditCardIcon, FileTextIcon } from "lucide-react";

import { ActivityList } from "@/components/common/activity-list";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { PipelineStepper } from "@/components/common/pipeline-stepper";
import { QueryGate, QuerySection } from "@/components/common/query-gate";
import {
  ActivityListSkeleton,
  FormCardSkeleton,
  ListRowsSkeleton,
  PipelineDetailSkeleton,
} from "@/components/common/skeletons";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  SectionTabs,
  SectionTabsList,
  SectionTabsTrigger,
} from "@/components/common/section-tabs";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { phaseQueries } from "@/features/phases/api";
import { PhaseContent } from "@/features/phases/components/phase-content";
import { QuotationPanel } from "@/features/phases/components/quotation-panel";
import { DecisionPanel } from "@/features/phases/components/decision-panel";
import { formatINR } from "@/features/phases/constants";
import { pipelineQueries } from "@/features/pipelines/api";
import { PipelineActions } from "@/features/pipelines/components/pipeline-actions";
import { BusinessAtAGlance } from "@/features/pipelines/components/business-at-a-glance";
import { PipelineFollowUpsTab } from "@/features/pipelines/components/pipeline-followups-tab";
import { PipelineResourcesTab } from "@/features/pipelines/components/pipeline-resources-tab";
import { PipelineTasksTab } from "@/features/pipelines/components/pipeline-tasks-tab";
import { PipelineOverview } from "@/features/pipelines/components/pipeline-overview";
import {
  LEAD_SOURCE_LABELS,
  PHASE_LABELS,
  WORKABLE_PHASES,
} from "@/features/pipelines/constants";
import { useCan } from "@/features/team/hooks/use-current-member";
import { PhaseType } from "@/generated/prisma/enums";

function TabPanelSkeleton({ variant }: { variant: "form" | "list" | "activity" }) {
  if (variant === "form") {
    return <FormCardSkeleton fields={5} />;
  }
  if (variant === "activity") {
    return <ActivityListSkeleton rows={8} />;
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-start gap-3 pt-4">
              <Skeleton className="size-8 rounded-md" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-10" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20" />
        ))}
      </div>
      <ListRowsSkeleton rows={6} />
    </div>
  );
}

export function PipelineDetail({ id }: { id: string }) {
  const [tab, setTab] = useState("overview");
  const pipelineQuery = useQuery(pipelineQueries.detail(id));
  const activityQuery = useQuery(pipelineQueries.activity(id));
  const reasonsQuery = useQuery(pipelineQueries.reasons());
  const tasksQuery = useQuery(pipelineQueries.tasks(id));
  const resourcesQuery = useQuery(pipelineQueries.resources(id));
  const followUpsQuery = useQuery(pipelineQueries.followUps(id));
  const phaseDataQuery = useQuery(phaseQueries.data(id));
  const canWrite = useCan("pipeline:write");
  const canTaskWrite = useCan("task:write");
  const canResourceWrite = useCan("resource:write");
  const pipeline = pipelineQuery.data;
  const phaseData = phaseDataQuery.data;
  const paymentPending = phaseData?.decision?.decision === "ACCEPTED";

  const deactivated = pipeline?.status === "DEACTIVATED";
  const phaseByType = new Map(pipeline?.phases.map((p) => [p.type, p]) ?? []);
  const current = pipeline ? (phaseByType.get(pipeline.currentPhase) ?? null) : null;
  const stepperIndex = pipeline
    ? Math.max(0, WORKABLE_PHASES.indexOf(pipeline.currentPhase))
    : 0;

  const followUpRows =
    followUpsQuery.data?.map((f) => ({
      id: f.id,
      reason: f.reason,
      dueAt: f.dueAt,
      completedAt: f.completedAt,
      assigneeName: f.assigneeName,
      assigneeId: f.assigneeId,
      notes: f.notes,
      phaseType: f.phaseType,
      rescheduleCount: f.rescheduleCount,
    })) ?? [];
  const pendingFollowUpCount = followUpRows.filter((f) => !f.completedAt).length;

  const taskRows =
    tasksQuery.data?.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueAt: t.dueAt,
      assigneeName: t.assigneeName,
      phaseType: t.phaseType,
    })) ?? [];
  const openTaskCount = taskRows.filter(
    (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED",
  ).length;

  const resourceRows =
    resourcesQuery.data?.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      contentType: r.contentType,
      sizeBytes: r.sizeBytes,
      phaseType: r.phaseType,
      createdAt: r.createdAt,
    })) ?? [];
  const resourceCount = resourceRows.length;

  return (
    <QueryGate
      isPending={pipelineQuery.isPending}
      isError={pipelineQuery.isError}
      error={pipelineQuery.error}
      skeleton={<PipelineDetailSkeleton />}
    >
      {pipeline ? (
        <>
          <PageHeader
            title={`${pipeline.business.name} · ${pipeline.name}`}
            description={pipeline.code}
            breadcrumbs={[{ label: "Pipelines", href: "/pipelines" }, { label: pipeline.code }]}
            action={<StatusBadge kind={paymentPending ? "PENDING" : pipeline.status} />}
          />

          <div className="flex flex-col gap-4">
            <PipelineStepper
              steps={WORKABLE_PHASES.map((p) => PHASE_LABELS[p])}
              currentStep={stepperIndex}
              deactivated={deactivated}
              paymentPending={paymentPending}
              phaseStartedAt={current?.startedAt ? new Date(current.startedAt) : null}
            />

            <SectionTabs value={tab} onValueChange={setTab} className="gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <SectionTabsList className="min-w-0 flex-1">
                  <SectionTabsTrigger value="overview">Overview</SectionTabsTrigger>
                  <SectionTabsTrigger value="details">Details</SectionTabsTrigger>
                  <SectionTabsTrigger value="tasks">
                    Tasks
                    {!tasksQuery.isPending && openTaskCount > 0 ? (
                      <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 justify-center px-1.5">
                        {openTaskCount}
                      </Badge>
                    ) : null}
                  </SectionTabsTrigger>
                  <SectionTabsTrigger value="followups">
                    Follow-ups
                    {!followUpsQuery.isPending && pendingFollowUpCount > 0 ? (
                      <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 justify-center px-1.5">
                        {pendingFollowUpCount}
                      </Badge>
                    ) : null}
                  </SectionTabsTrigger>
                  <SectionTabsTrigger value="resources">
                    Resources
                    {!resourcesQuery.isPending && resourceCount > 0 ? (
                      <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 justify-center px-1.5">
                        {resourceCount}
                      </Badge>
                    ) : null}
                  </SectionTabsTrigger>
                  <SectionTabsTrigger value="quotation">Quotation</SectionTabsTrigger>
                  <SectionTabsTrigger value="payments">Payments</SectionTabsTrigger>
                  <SectionTabsTrigger value="activity">Activity</SectionTabsTrigger>
                </SectionTabsList>

                {!deactivated ? (
                  <PipelineActions
                    pipelineId={pipeline.id}
                    status={pipeline.status}
                    currentPhase={pipeline.currentPhase}
                    canWrite={canWrite}
                    reasons={(reasonsQuery.data ?? []).map((r) => ({ id: r.id, label: r.label }))}
                    compact
                    className="w-full shrink-0 lg:w-auto"
                  />
                ) : null}
              </div>

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

                <PipelineOverview
                  tasks={(tasksQuery.data ?? []).map((t) => ({
                    id: t.id,
                    status: t.status,
                    dueAt: t.dueAt,
                  }))}
                  followUps={followUpRows.map((f) => ({
                    completedAt: f.completedAt,
                    dueAt: f.dueAt,
                    rescheduleCount: f.rescheduleCount,
                  }))}
                  activities={activityQuery.data ?? []}
                  tasksPending={tasksQuery.isPending}
                  tasksError={tasksQuery.isError}
                  tasksErrorObj={tasksQuery.error}
                  followUpsPending={followUpsQuery.isPending}
                  followUpsError={followUpsQuery.isError}
                  followUpsErrorObj={followUpsQuery.error}
                  activityPending={activityQuery.isPending}
                  activityError={activityQuery.isError}
                  activityErrorObj={activityQuery.error}
                  onOpenActivity={() => setTab("activity")}
                  onOpenFollowUps={() => setTab("followups")}
                  onOpenTasks={() => setTab("tasks")}
                />
              </TabsContent>

              <TabsContent value="details" className="flex flex-col gap-4">
                <BusinessAtAGlance
                  businessName={pipeline.business.name}
                  ownerName={pipeline.ownerName}
                  leadSourceLabel={LEAD_SOURCE_LABELS[pipeline.leadSource]}
                  paymentPending={paymentPending}
                  contactInfo={phaseData?.contactInfo}
                />

                <QuerySection
                  isPending={phaseDataQuery.isPending}
                  isError={phaseDataQuery.isError}
                  error={phaseDataQuery.error}
                  skeleton={<FormCardSkeleton fields={5} />}
                  errorTitle="Could not load phase content"
                >
                  {phaseData ? (
                    <PhaseContent
                      pipelineId={pipeline.id}
                      currentPhase={pipeline.currentPhase}
                      phaseData={phaseData}
                      canWrite={canWrite && !deactivated}
                    />
                  ) : null}
                </QuerySection>
              </TabsContent>

              <TabsContent value="tasks">
                <QuerySection
                  isPending={tasksQuery.isPending}
                  isError={tasksQuery.isError}
                  error={tasksQuery.error}
                  skeleton={<TabPanelSkeleton variant="list" />}
                  errorTitle="Could not load tasks"
                >
                  <PipelineTasksTab
                    pipelineId={pipeline.id}
                    businessId={pipeline.businessId}
                    currentPhase={pipeline.currentPhase}
                    tasks={taskRows}
                    canWrite={canTaskWrite}
                    deactivated={deactivated}
                  />
                </QuerySection>
              </TabsContent>

              <TabsContent value="followups">
                <QuerySection
                  isPending={followUpsQuery.isPending}
                  isError={followUpsQuery.isError}
                  error={followUpsQuery.error}
                  skeleton={<TabPanelSkeleton variant="list" />}
                  errorTitle="Could not load follow-ups"
                >
                  <PipelineFollowUpsTab
                    pipelineId={pipeline.id}
                    businessId={pipeline.businessId}
                    currentPhase={pipeline.currentPhase}
                    followUps={followUpRows}
                    canWrite={canTaskWrite}
                    deactivated={deactivated}
                  />
                </QuerySection>
              </TabsContent>

              <TabsContent value="resources">
                <QuerySection
                  isPending={resourcesQuery.isPending}
                  isError={resourcesQuery.isError}
                  error={resourcesQuery.error}
                  skeleton={<TabPanelSkeleton variant="list" />}
                  errorTitle="Could not load resources"
                >
                  <PipelineResourcesTab
                    pipelineId={pipeline.id}
                    businessId={pipeline.businessId}
                    currentPhase={pipeline.currentPhase}
                    resources={resourceRows}
                    canWrite={canResourceWrite}
                    deactivated={deactivated}
                  />
                </QuerySection>
              </TabsContent>

              <TabsContent value="quotation">
                <QuerySection
                  isPending={phaseDataQuery.isPending}
                  isError={phaseDataQuery.isError}
                  error={phaseDataQuery.error}
                  skeleton={<FormCardSkeleton fields={3} />}
                  errorTitle="Could not load quotations"
                >
                  {phaseData && pipeline.currentPhase === PhaseType.QUOTATION ? (
                    <div className="flex flex-col gap-4">
                      <QuotationPanel
                        pipelineId={pipeline.id}
                        quotations={phaseData.quotations}
                        canWrite={canWrite && !deactivated}
                      />
                      <DecisionPanel
                        pipelineId={pipeline.id}
                        decision={phaseData.decision}
                        reasons={(reasonsQuery.data ?? []).map((r) => ({
                          id: r.id,
                          label: r.label,
                        }))}
                        canWrite={canWrite && !deactivated}
                      />
                    </div>
                  ) : phaseData?.quotations.length ? (
                    <div className="flex flex-col gap-2">
                      {phaseData.quotations.map((q) => (
                        <div key={q.id} className="rounded-lg border p-3 text-sm">
                          V{q.version} · {formatINR(q.subtotal)} · {q.status}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={FileTextIcon}
                      title="No quotation yet"
                      description="Create a quotation when the pipeline reaches the Quotation phase."
                    />
                  )}
                </QuerySection>
              </TabsContent>
              <TabsContent value="payments">
                <EmptyState
                  icon={CreditCardIcon}
                  title="No payments yet"
                  description="Payments arrive in a later phase."
                />
              </TabsContent>

              <TabsContent value="activity">
                <QuerySection
                  isPending={activityQuery.isPending}
                  isError={activityQuery.isError}
                  error={activityQuery.error}
                  skeleton={<TabPanelSkeleton variant="activity" />}
                  errorTitle="Could not load activity"
                >
                  <ActivityList items={activityQuery.data ?? []} />
                </QuerySection>
              </TabsContent>
            </SectionTabs>
          </div>
        </>
      ) : null}
    </QueryGate>
  );
}
