"use client";

import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { pipelineQueries } from "@/features/pipelines/api";
import { CreatePipelineForm } from "@/features/pipelines/components/create-pipeline-form";

export function PipelineCreateDialog({
  trigger,
  businessId,
}: {
  trigger: ReactNode;
  businessId?: string;
}) {
  const [open, setOpen] = useState(false);
  const options = useQuery({ ...pipelineQueries.options(), enabled: open });
  const fixed = businessId
    ? options.data?.businesses.find((b) => b.id === businessId)
    : undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New pipeline</DialogTitle>
          <DialogDescription>
            Start a new opportunity. It begins at Discovery.
          </DialogDescription>
        </DialogHeader>
        {options.isPending ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <CreatePipelineForm
            businesses={options.data?.businesses ?? []}
            assignees={options.data?.assignees ?? []}
            fixedBusiness={fixed ? { id: fixed.id, name: fixed.name } : null}
            onCancel={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
