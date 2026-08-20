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
import { FollowUpForm } from "@/features/followups/components/followup-form";
import { taskQueries } from "@/features/tasks/api";
import type { PhaseType } from "@/generated/prisma/enums";

export function FollowUpFormDialog({
  members,
  businessId,
  pipelineId,
  phaseType,
  trigger,
}: {
  members?: { id: string; name: string }[];
  businessId?: string | null;
  pipelineId?: string | null;
  phaseType?: PhaseType | null;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const optionsQuery = useQuery({ ...taskQueries.options(), enabled: open && !members });
  const resolved = members ?? optionsQuery.data?.members ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule follow-up</DialogTitle>
          <DialogDescription>A scheduled action so this opportunity doesn&apos;t go cold.</DialogDescription>
        </DialogHeader>
        {members || optionsQuery.data ? (
          <FollowUpForm
            members={resolved}
            businessId={businessId}
            pipelineId={pipelineId}
            phaseType={phaseType}
            onSuccess={() => {
              setOpen(false);
            }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
