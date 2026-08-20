"use client";

import Link from "next/link";
import { useState } from "react";
import { PlusIcon } from "lucide-react";

import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FollowUpFormDialog } from "@/features/followups/components/followup-form-dialog";
import { FollowUpList, type FollowUpRow } from "@/features/followups/components/followup-list";
import { RESOURCE_TYPE_LABELS } from "@/features/resources/constants";
import { ResourcePreviewDialog } from "@/features/resources/components/resource-preview-dialog";
import { UploadDialog } from "@/features/resources/components/upload-dialog";
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog";
import type { TaskFormInitial } from "@/features/tasks/components/task-form";
import { PhaseType, Priority, type ResourceType, type TaskStatus } from "@/generated/prisma/enums";

export type PhaseWorkTask = { id: string; title: string; status: TaskStatus; dueAt: string | Date | null };
export type PhaseWorkResource = {
  id: string;
  name: string;
  type: ResourceType;
  contentType?: string | null;
};

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{title}</p>
        {action}
      </div>
      {children}
    </div>
  );
}

export function PhaseWork({
  businessId,
  pipelineId,
  phaseType,
  tasks,
  resources,
  followUps,
  canTaskWrite,
  canResourceWrite,
}: {
  businessId: string | null;
  pipelineId: string;
  phaseType: PhaseType;
  tasks: PhaseWorkTask[];
  resources: PhaseWorkResource[];
  followUps: FollowUpRow[];
  canTaskWrite: boolean;
  canResourceWrite: boolean;
}) {
  const [preview, setPreview] = useState<PhaseWorkResource | null>(null);
  const taskPrefill: TaskFormInitial = {
    title: "",
    assigneeId: "",
    dueAt: "",
    priority: Priority.MEDIUM,
    status: "TODO" as TaskStatus,
    businessId: businessId ?? "",
    pipelineId,
    phaseType,
    notes: "",
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
      <Section
        title="Phase tasks"
        action={
          canTaskWrite ? (
            <TaskFormDialog
              mode="create"
              initial={taskPrefill}
              trigger={
                <Button variant="outline" size="sm">
                  <PlusIcon className="size-4" />
                  Add task
                </Button>
              }
            />
          ) : null
        }
      >
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks for this phase yet.</p>
        ) : (
          <div className="flex flex-col divide-y">
            {tasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <Link href={`/todos/${t.id}`} className="truncate hover:underline">
                  {t.title}
                </Link>
                <StatusBadge kind={t.status} />
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Phase resources"
        action={
          canResourceWrite ? (
            <UploadDialog
              prefill={{ businessId, pipelineId, phaseType }}
              trigger={
                <Button variant="outline" size="sm">
                  <PlusIcon className="size-4" />
                  Add resource
                </Button>
              }
            />
          ) : null
        }
      >
        {resources.length === 0 ? (
          <p className="text-sm text-muted-foreground">No resources for this phase yet.</p>
        ) : (
          <div className="flex flex-col divide-y">
            {resources.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <button
                  type="button"
                  className="truncate text-left hover:underline"
                  onClick={() => setPreview(r)}
                >
                  {r.name}
                </button>
                <Badge variant="secondary" className="font-normal">
                  {RESOURCE_TYPE_LABELS[r.type]}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Section>

      <div className="md:col-span-2">
        <Section
          title="Follow-ups"
          action={
            canTaskWrite ? (
              <FollowUpFormDialog
                businessId={businessId}
                pipelineId={pipelineId}
                phaseType={phaseType}
                trigger={
                  <Button variant="outline" size="sm">
                    <PlusIcon className="size-4" />
                    Add follow-up
                  </Button>
                }
              />
            ) : null
          }
        >
          <FollowUpList items={followUps} canWrite={canTaskWrite} />
        </Section>
      </div>
      </div>
      <ResourcePreviewDialog
        resource={preview}
        open={preview !== null}
        onOpenChange={(next) => {
          if (!next) setPreview(null);
        }}
      />
    </>
  );
}
