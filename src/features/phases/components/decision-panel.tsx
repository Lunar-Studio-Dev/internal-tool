"use client";

import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { FieldLabel } from "@/components/common/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSetClientDecision, type PipelineDecisionDto } from "@/features/phases/api";
import type { DeactivationReasonOption } from "@/features/pipelines/components/deactivate-dialog";
import { mutationErrorMessage } from "@/lib/api/errors";

const DECISION_LABELS = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  LATER: "Later",
} as const;

export function DecisionPanel({
  pipelineId,
  decision,
  reasons,
  canWrite,
}: {
  pipelineId: string;
  decision: PipelineDecisionDto | null;
  reasons: DeactivationReasonOption[];
  canWrite: boolean;
}) {
  const setDecision = useSetClientDecision(pipelineId);
  const [reasonId, setReasonId] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDueAt, setFollowUpDueAt] = useState("");

  const current = decision?.decision ?? "PENDING";

  async function submit(decisionValue: "ACCEPTED" | "REJECTED" | "LATER") {
    try {
      await setDecision.mutateAsync({
        decision: decisionValue,
        notes,
        reasonId: decisionValue === "REJECTED" ? reasonId : undefined,
        followUpDueAt: decisionValue === "LATER" ? followUpDueAt : undefined,
        followUpReason: decisionValue === "LATER" ? "Client asked to revisit later" : undefined,
      });
      toast.success(
        decisionValue === "ACCEPTED"
          ? "Quotation accepted — payment pending"
          : decisionValue === "REJECTED"
            ? "Pipeline deactivated"
            : "Follow-up scheduled",
      );
    } catch (error) {
      toast.error(mutationErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Client decision</p>
        <Badge variant={current === "ACCEPTED" ? "default" : "secondary"}>
          {current === "ACCEPTED" ? "Payment pending" : DECISION_LABELS[current as keyof typeof DECISION_LABELS]}
        </Badge>
      </div>

      {current === "ACCEPTED" ? (
        <p className="text-sm text-muted-foreground">
          The client accepted the quotation. Record the initial payment on the Payments tab to unlock
          Project Management, then keep receiving balance payments until the full contract is paid.
        </p>
      ) : null}

      {canWrite && current === "PENDING" ? (
        <>
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="decisionNotes">
              Notes
            </FieldLabel>
            <Textarea id="decisionNotes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={setDecision.isPending} onClick={() => void submit("ACCEPTED")}>
              {setDecision.isPending ? <Loader2Icon className="size-4 animate-spin" /> : null}
              Accepted
            </Button>
            <Button type="button" variant="outline" disabled={setDecision.isPending} onClick={() => void submit("LATER")}>
              Later
            </Button>
            <Button type="button" variant="destructive" disabled={setDecision.isPending} onClick={() => void submit("REJECTED")}>
              Rejected
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <FieldLabel>Rejection reason</FieldLabel>
              <Select value={reasonId} onValueChange={setReasonId}>
                <SelectTrigger>
                  <SelectValue placeholder="If rejecting…" />
                </SelectTrigger>
                <SelectContent>
                  {reasons.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="followUpDueAt">
                Follow-up date (if Later)
              </FieldLabel>
              <Input
                id="followUpDueAt"
                type="datetime-local"
                value={followUpDueAt}
                onChange={(e) => setFollowUpDueAt(e.target.value)}
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
