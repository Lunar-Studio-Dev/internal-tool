"use client";

import Link from "next/link";
import { Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DuplicateCandidate } from "@/features/businesses/types";

/**
 * WF-09 — surfaces possible existing businesses before a duplicate is created.
 * "Open Existing" is always available; "Create New Anyway" only for admins.
 */
export function DuplicateDialog({
  candidates,
  open,
  canForce,
  pending,
  onCancel,
  onForceCreate,
}: {
  candidates: DuplicateCandidate[];
  open: boolean;
  canForce: boolean;
  pending: boolean;
  onCancel: () => void;
  onForceCreate: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Possible existing business</DialogTitle>
          <DialogDescription>
            We found businesses that may already exist. Open one instead of creating a duplicate.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
          {candidates.map((candidate) => {
            const meta = [candidate.website, candidate.email, candidate.primaryContactEmail]
              .filter(Boolean)
              .join(" · ");
            return (
              <div
                key={candidate.id}
                className="flex items-center justify-between gap-3 rounded-md border p-3"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{candidate.name}</div>
                  {meta ? (
                    <div className="truncate text-xs text-muted-foreground">{meta}</div>
                  ) : null}
                  <div className="text-xs text-muted-foreground">
                    {candidate.pipelineCount} pipelines / {candidate.activePipelineCount} active
                  </div>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/businesses/${candidate.id}`}>Open</Link>
                </Button>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          {canForce ? (
            <Button variant="destructive" onClick={onForceCreate} disabled={pending}>
              {pending ? <Loader2Icon className="size-4 animate-spin" /> : null}
              Create New Anyway
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
