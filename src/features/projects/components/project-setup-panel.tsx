"use client";

import { useState } from "react";
import { format } from "date-fns";
import { FolderKanbanIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { FieldLabel } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProject, type ProjectSetupDto } from "@/features/projects/api";
import { HandoffChecklistView } from "@/features/projects/components/handoff-checklist";
import { HandoffSummary } from "@/features/projects/components/handoff-summary";
import { PhaseType } from "@/generated/prisma/enums";
import { mutationErrorMessage } from "@/lib/api/errors";

const NONE = "__none__";

export function ProjectSetupPanel({
  pipelineId,
  context,
  canWrite,
}: {
  pipelineId: string;
  context: ProjectSetupDto;
  canWrite: boolean;
}) {
  const createProject = useCreateProject(pipelineId);
  const [name, setName] = useState(context.pipeline.name);
  const [managerId, setManagerId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");

  if (context.pipeline.currentPhase !== PhaseType.PROJECT_MANAGEMENT) {
    return (
      <EmptyState
        icon={FolderKanbanIcon}
        title="Project Management not active"
        description="Complete the initial payment gate to open Project Management and create the handoff."
      />
    );
  }

  if (context.project) {
    return <HandoffSummary context={context} pipelineHref={`/pipelines/${pipelineId}`} />;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await createProject.mutateAsync({
        name,
        managerId: managerId || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        notes,
      });
      toast.success("Project handed over to development");
    } catch (error) {
      toast.error(mutationErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Handover to development</CardTitle>
        </CardHeader>
        <CardContent>
          {canWrite ? (
            <form className="flex flex-col gap-3" onSubmit={(e) => void submit(e)}>
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="projectName">Project name</FieldLabel>
                <Input
                  id="projectName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={200}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <FieldLabel htmlFor="projectManager">Project manager</FieldLabel>
                  <Select
                    value={managerId || NONE}
                    onValueChange={(v) => setManagerId(v === NONE ? "" : v)}
                  >
                    <SelectTrigger id="projectManager">
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Unassigned</SelectItem>
                      {context.members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Suggested code</FieldLabel>
                  <Input value="Assigned on create (PRJ-…)" disabled />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <FieldLabel htmlFor="projectStart">Start date</FieldLabel>
                  <Input
                    id="projectStart"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel htmlFor="projectDeadline">Expected deadline</FieldLabel>
                  <Input
                    id="projectDeadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="projectNotes">Notes</FieldLabel>
                <Textarea
                  id="projectNotes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={5000}
                />
              </div>
              <Button type="submit" disabled={createProject.isPending} className="self-start">
                {createProject.isPending ? <Loader2Icon className="size-4 animate-spin" /> : null}
                Handover to development
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              You need project write access to create the handoff.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Handoff checklist</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <HandoffChecklistView checklist={context.checklist} />
          <p className="text-xs text-muted-foreground">
            Checked as of {format(new Date(), "d MMM yyyy, HH:mm")}. Incomplete items can still be
            finished after handoff.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
