"use client";

import { type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FollowUpForm } from "@/features/followups/components/followup-form";
import type { PhaseType } from "@/generated/prisma/enums";

export function FollowUpFormDialog({
  members,
  businessId,
  pipelineId,
  phaseType,
  trigger,
}: {
  members: { id: string; name: string }[];
  businessId?: string | null;
  pipelineId?: string | null;
  phaseType?: PhaseType | null;
  trigger: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule follow-up</DialogTitle>
          <DialogDescription>A scheduled action so this opportunity doesn&apos;t go cold.</DialogDescription>
        </DialogHeader>
        <FollowUpForm
          members={members}
          businessId={businessId}
          pipelineId={pipelineId}
          phaseType={phaseType}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
