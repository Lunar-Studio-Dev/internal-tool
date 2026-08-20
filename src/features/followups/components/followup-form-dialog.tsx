"use client";

import { type ReactNode, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/common/empty-state";
import { FormCardSkeleton } from "@/components/common/skeletons";
import {
  FollowUpForm,
  type FollowUpFormInitial,
} from "@/features/followups/components/followup-form";
import { taskQueries } from "@/features/tasks/api";
import type { PhaseType } from "@/generated/prisma/enums";
import { AlertCircleIcon } from "lucide-react";

export function FollowUpFormDialog({
  members,
  businessId,
  pipelineId,
  phaseType,
  followUp,
  trigger,
}: {
  members?: { id: string; name: string }[];
  businessId?: string | null;
  pipelineId?: string | null;
  phaseType?: PhaseType | null;
  followUp?: FollowUpFormInitial;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(followUp);
  const optionsQuery = useQuery({ ...taskQueries.options(), enabled: open && !members });
  const resolved = members ?? optionsQuery.data?.members ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit follow-up" : "Schedule follow-up"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update details or change the due date. Date changes are tracked in reschedule history."
              : "A scheduled action so this opportunity doesn't go cold."}
          </DialogDescription>
        </DialogHeader>
        {members || optionsQuery.data ? (
          <FollowUpForm
            members={resolved}
            businessId={businessId}
            pipelineId={pipelineId}
            phaseType={phaseType}
            followUp={followUp}
            onSuccess={() => {
              setOpen(false);
            }}
          />
        ) : optionsQuery.isError ? (
          <EmptyState
            icon={AlertCircleIcon}
            title="Could not load form options"
            description={optionsQuery.error?.message ?? "Try again."}
            className="p-6"
          />
        ) : (
          <FormCardSkeleton fields={4} />
        )}
      </DialogContent>
    </Dialog>
  );
}
