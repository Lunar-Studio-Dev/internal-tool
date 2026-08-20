"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { ActivityList } from "@/components/common/activity-list";
import { EmptyState } from "@/components/common/empty-state";
import { InfoRow } from "@/components/common/info-row";
import { PageHeader } from "@/components/common/page-header";
import { QueryGate } from "@/components/common/query-gate";
import { BusinessDetailSkeleton } from "@/components/common/skeletons";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SectionTabs,
  SectionTabsList,
  SectionTabsTrigger,
} from "@/components/common/section-tabs";
import { TabsContent } from "@/components/ui/tabs";
import { teamQueries } from "@/features/team/api";
import { MemberDetailActions } from "@/features/team/components/member-detail-actions";
import { ROLE_LABELS } from "@/features/team/constants";
import { PHASE_LABELS } from "@/features/pipelines/constants";
import type { PhaseType } from "@/generated/prisma/enums";

export function MemberDetailView({ id }: { id: string }) {
  const memberQuery = useQuery(teamQueries.detail(id));
  const workloadQuery = useQuery(teamQueries.workload(id));
  const member = memberQuery.data;
  const workload = workloadQuery.data;

  return (
    <QueryGate
      isPending={memberQuery.isPending}
      isError={memberQuery.isError}
      error={memberQuery.error}
      skeleton={<BusinessDetailSkeleton />}
    >
      {member ? (
        <>
          <PageHeader
            title={member.name}
            description={member.email}
            breadcrumbs={[{ label: "Team", href: "/team" }, { label: member.name }]}
            action={
              <MemberDetailActions
                id={member.id}
                status={member.status}
                initial={{
                  id: member.id,
                  name: member.name,
                  email: member.email,
                  phone: member.phone ?? "",
                  roles: member.roles,
                }}
              />
            }
          />

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge kind={member.status} />
            {member.roles.map((role) => (
              <Badge key={role} variant="secondary">
                {ROLE_LABELS[role]}
              </Badge>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Workload</CardTitle>
                <CardDescription>Live counts from assigned work.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {(
                  [
                    ["Active Tasks", workload?.counts.activeTasks ?? "—"],
                    ["Overdue", workload?.counts.overdue ?? "—"],
                    ["Pipelines", workload?.counts.pipelines ?? "—"],
                    ["Follow-ups", workload?.counts.followUps ?? "—"],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label}>
                    <div className="text-2xl font-semibold">{value}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <InfoRow label="Email" value={member.email} />
                <InfoRow label="Phone" value={member.phone} />
                <InfoRow
                  label="Account"
                  value={
                    member.status === "PENDING"
                      ? "Invited — awaiting first sign-in"
                      : member.authUserId
                        ? "Linked"
                        : "Not linked"
                  }
                />
              </CardContent>
            </Card>
          </div>

          <SectionTabs defaultValue="tasks">
            <SectionTabsList>
              <SectionTabsTrigger value="tasks">Tasks</SectionTabsTrigger>
              <SectionTabsTrigger value="pipelines">Pipelines</SectionTabsTrigger>
              <SectionTabsTrigger value="activity">Activity</SectionTabsTrigger>
              <SectionTabsTrigger value="roles">Roles</SectionTabsTrigger>
            </SectionTabsList>
            <TabsContent value="tasks">
              {!workload?.tasks.length ? (
                <EmptyState title="No tasks yet" description="Assigned tasks appear here." />
              ) : (
                <div className="flex flex-col divide-y rounded-lg border">
                  {workload.tasks.map((task) => (
                    <Link
                      key={task.id}
                      href={`/todos/${task.id}`}
                      className="flex items-center justify-between gap-2 p-3 text-sm hover:bg-muted/40"
                    >
                      <span className="font-medium">{task.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {[task.businessName, task.pipelineCode, task.status]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="pipelines">
              {!workload?.pipelines.length ? (
                <EmptyState title="No pipelines yet" description="Owned pipelines appear here." />
              ) : (
                <div className="flex flex-col divide-y rounded-lg border">
                  {workload.pipelines.map((pipeline) => (
                    <Link
                      key={pipeline.id}
                      href={`/pipelines/${pipeline.id}`}
                      className="flex items-center justify-between gap-2 p-3 text-sm hover:bg-muted/40"
                    >
                      <span className="font-medium">
                        {pipeline.code} · {pipeline.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {pipeline.businessName} ·{" "}
                        {PHASE_LABELS[pipeline.currentPhase as PhaseType] ?? pipeline.currentPhase}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="activity">
              <ActivityList
                items={workload?.activity ?? []}
                emptyDescription="Audit-trail entries for this member will show here."
              />
            </TabsContent>
            <TabsContent value="roles">
              <div className="flex flex-wrap gap-2 p-1">
                {member.roles.map((role) => (
                  <Badge key={role} variant="secondary">
                    {ROLE_LABELS[role]}
                  </Badge>
                ))}
              </div>
            </TabsContent>
          </SectionTabs>
        </>
      ) : null}
    </QueryGate>
  );
}
