"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FolderClosedIcon, ListTodoIcon, PlusIcon, UploadIcon, WalletIcon, WorkflowIcon } from "lucide-react";

import { ActivityList } from "@/components/common/activity-list";
import { EmptyState } from "@/components/common/empty-state";
import { InfoRow } from "@/components/common/info-row";
import { PageHeader } from "@/components/common/page-header";
import { QueryGate } from "@/components/common/query-gate";
import { BusinessDetailSkeleton } from "@/components/common/skeletons";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SectionTabs,
  SectionTabsList,
  SectionTabsTrigger,
} from "@/components/common/section-tabs";
import { TabsContent } from "@/components/ui/tabs";
import { businessQueries } from "@/features/businesses/api";
import { BusinessDetailActions } from "@/features/businesses/components/business-detail-actions";
import type { BusinessFormInitial } from "@/features/businesses/components/business-form";
import { ContactTable, type ContactRow } from "@/features/businesses/components/contact-table";
import { CONTACT_ROLE_LABELS } from "@/features/businesses/constants";
import { PipelineCreateDialog } from "@/features/pipelines/components/pipeline-create-dialog";
import { PHASE_LABELS } from "@/features/pipelines/constants";
import { ResourceLibraryTable, type ResourceRow } from "@/features/resources/components/resource-library-table";
import { UploadDialog } from "@/features/resources/components/upload-dialog";
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog";
import { useCan } from "@/features/team/hooks/use-current-member";

const SOCIAL_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  x: "X",
};

export function BusinessDetail({ id }: { id: string }) {
  const businessQuery = useQuery(businessQueries.detail(id));
  const activityQuery = useQuery(businessQueries.activity(id));
  const tasksQuery = useQuery(businessQueries.tasks(id));
  const resourcesQuery = useQuery(businessQueries.resources(id));
  const canCreatePipeline = useCan("pipeline:write");
  const canTaskWrite = useCan("task:write");
  const canResourceWrite = useCan("resource:write");
  const business = businessQuery.data;

  const social = (business?.social ?? {}) as Record<string, string>;
  const socialEntries = Object.entries(social).filter(([, v]) => Boolean(v));
  const primary = business?.contacts.find((c) => c.isPrimary) ?? business?.contacts[0] ?? null;
  const contactRows: ContactRow[] =
    business?.contacts.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone ?? "",
      role: c.role,
      isPrimary: c.isPrimary,
      notes: c.notes ?? "",
    })) ?? [];

  const editInitial: BusinessFormInitial | null = business
    ? {
        id: business.id,
        name: business.name,
        website: business.website ?? "",
        email: business.email ?? "",
        phone: business.phone ?? "",
        industry: business.industry ?? "",
        location: business.location ?? "",
        address: business.address ?? "",
        notes: business.notes ?? "",
        social: {
          linkedin: social.linkedin ?? "",
          instagram: social.instagram ?? "",
          facebook: social.facebook ?? "",
          x: social.x ?? "",
        },
      }
    : null;

  const resourceRows: ResourceRow[] = (resourcesQuery.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    contentType: r.contentType,
    sizeBytes: r.sizeBytes,
    businessId: r.businessId,
    businessName: r.businessName,
    pipelineId: r.pipelineId,
    pipelineCode: r.pipelineCode,
    phaseType: r.phaseType,
  }));

  const subtitle = [business?.website, business?.industry, business?.location]
    .filter(Boolean)
    .join(" · ");

  return (
    <QueryGate
      isPending={businessQuery.isPending}
      isError={businessQuery.isError}
      error={businessQuery.error}
      skeleton={<BusinessDetailSkeleton />}
    >
      {business && editInitial ? (
        <>
          <PageHeader
            title={business.name}
            description={subtitle || undefined}
            breadcrumbs={[{ label: "Businesses", href: "/businesses" }, { label: business.name }]}
            action={<BusinessDetailActions initial={editInitial} />}
          />

          <SectionTabs defaultValue="overview" className="gap-4">
            <SectionTabsList>
              <SectionTabsTrigger value="overview">Overview</SectionTabsTrigger>
              <SectionTabsTrigger value="pipelines">Pipelines</SectionTabsTrigger>
              <SectionTabsTrigger value="contacts">Contacts</SectionTabsTrigger>
              <SectionTabsTrigger value="resources">Resources</SectionTabsTrigger>
              <SectionTabsTrigger value="tasks">Tasks</SectionTabsTrigger>
              <SectionTabsTrigger value="financials">Financials</SectionTabsTrigger>
              <SectionTabsTrigger value="activity">Activity</SectionTabsTrigger>
            </SectionTabsList>

            <TabsContent value="overview">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Business information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <InfoRow label="Website" value={business.website} />
                    <InfoRow label="Email" value={business.email} />
                    <InfoRow label="Phone" value={business.phone} />
                    <InfoRow label="Industry" value={business.industry} />
                    <InfoRow label="Location" value={business.location} />
                    <InfoRow label="Address" value={business.address} />
                    {socialEntries.length > 0 ? (
                      <div className="col-span-2 flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Social</span>
                        <div className="flex flex-wrap gap-1">
                          {socialEntries.map(([key, value]) => (
                            <Badge key={key} variant="outline" className="font-normal">
                              {SOCIAL_LABELS[key] ?? key}: {value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {business.notes ? (
                      <div className="col-span-2">
                        <InfoRow label="Notes" value={business.notes} />
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Primary contact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {primary ? (
                      <div className="flex flex-col gap-3">
                        <InfoRow label="Name" value={primary.name} />
                        <InfoRow label="Email" value={primary.email} />
                        <InfoRow label="Phone" value={primary.phone} />
                        <InfoRow label="Role" value={CONTACT_ROLE_LABELS[primary.role]} />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No contact on file.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="pipelines">
              <div className="flex flex-col gap-4">
                {canCreatePipeline ? (
                  <div className="flex justify-end">
                    <PipelineCreateDialog
                      businessId={business.id}
                      trigger={
                        <Button size="sm">
                          <PlusIcon className="size-4" />
                          New Pipeline
                        </Button>
                      }
                    />
                  </div>
                ) : null}
                {business.pipelines.length === 0 ? (
                  <EmptyState
                    icon={WorkflowIcon}
                    title="No pipelines yet"
                    description="Create the first pipeline for this business."
                  />
                ) : (
                  <div className="flex flex-col divide-y rounded-lg border">
                    {business.pipelines.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-2 p-3 text-sm">
                        <div className="flex min-w-0 flex-col">
                          <Link href={`/pipelines/${p.id}`} className="font-medium hover:underline">
                            {p.code} · {p.name}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            {PHASE_LABELS[p.currentPhase]}
                          </span>
                        </div>
                        <StatusBadge kind={p.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="contacts">
              <ContactTable businessId={business.id} contacts={contactRows} />
            </TabsContent>

            <TabsContent value="resources">
              <div className="flex flex-col gap-4">
                {canResourceWrite ? (
                  <div className="flex justify-end">
                    <UploadDialog
                      prefill={{ businessId: business.id }}
                      trigger={
                        <Button size="sm">
                          <UploadIcon className="size-4" />
                          Upload
                        </Button>
                      }
                    />
                  </div>
                ) : null}
                {resourceRows.length === 0 ? (
                  <EmptyState
                    icon={FolderClosedIcon}
                    title="No resources yet"
                    description="Documents and links attached to this business will appear here."
                  />
                ) : (
                  <ResourceLibraryTable resources={resourceRows} canWrite={canResourceWrite} />
                )}
              </div>
            </TabsContent>

            <TabsContent value="tasks">
              <div className="flex flex-col gap-4">
                {canTaskWrite ? (
                  <div className="flex justify-end">
                    <TaskFormDialog
                      mode="create"
                      prefill={{ businessId: business.id }}
                      trigger={
                        <Button size="sm">
                          <PlusIcon className="size-4" />
                          Add Task
                        </Button>
                      }
                    />
                  </div>
                ) : null}
                {!tasksQuery.data?.length ? (
                  <EmptyState
                    icon={ListTodoIcon}
                    title="No tasks yet"
                    description="Tasks related to this business will appear here."
                  />
                ) : (
                  <div className="flex flex-col divide-y rounded-lg border">
                    {tasksQuery.data.map((task) => (
                      <Link
                        key={task.id}
                        href={`/todos/${task.id}`}
                        className="flex items-center justify-between gap-2 p-3 text-sm hover:bg-muted/40"
                      >
                        <span className="font-medium">{task.title}</span>
                        <span className="text-xs text-muted-foreground">{task.status}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="financials">
              <EmptyState
                icon={WalletIcon}
                title="No financials yet"
                description="Earnings and payments for this business will appear here."
              />
            </TabsContent>

            <TabsContent value="activity">
              <ActivityList items={activityQuery.data ?? []} />
            </TabsContent>
          </SectionTabs>
        </>
      ) : null}
    </QueryGate>
  );
}
