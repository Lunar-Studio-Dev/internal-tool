"use client";

import { type FormEvent, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { FieldError, FieldLabel } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSaveDiscovery, type PhaseDataDto } from "@/features/phases/api";
import { DEFAULT_CHECKLIST, type DiscoveryChecklist } from "@/features/phases/constants";
import { saveDiscoverySchema } from "@/features/phases/schemas/phase.schema";
import { mutationErrorMessage } from "@/lib/api/errors";
import { parseForm, type FieldErrors } from "@/lib/form";

const CHECKLIST_LABELS: Record<keyof DiscoveryChecklist, string> = {
  understandBusiness: "Understand the business",
  painPoints: "Identify pain points",
  softwareOpportunity: "Software / automation opportunity",
  canAddValue: "Can we add meaningful value?",
};

export function DiscoveryForm({
  pipelineId,
  discovery,
  canWrite,
}: {
  pipelineId: string;
  discovery: PhaseDataDto["discovery"];
  canWrite: boolean;
}) {
  const save = useSaveDiscovery(pipelineId);
  const [errors, setErrors] = useState<FieldErrors>({});
  const checklist = (discovery?.checklist as DiscoveryChecklist | null) ?? DEFAULT_CHECKLIST;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canWrite) return;
    const data = new FormData(e.currentTarget);
    const parsed = parseForm(saveDiscoverySchema.omit({ pipelineId: true }), {
      meetingAt: String(data.get("meetingAt") ?? ""),
      meetingLink: String(data.get("meetingLink") ?? ""),
      meetingOwnerId: String(data.get("meetingOwnerId") ?? ""),
      notes: String(data.get("notes") ?? ""),
      checklist: {
        understandBusiness: data.get("understandBusiness") === "on",
        painPoints: data.get("painPoints") === "on",
        softwareOpportunity: data.get("softwareOpportunity") === "on",
        canAddValue: data.get("canAddValue") === "on",
      },
    });
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    try {
      await save.mutateAsync(parsed.data);
      toast.success("Discovery saved");
    } catch (error) {
      toast.error(mutationErrorMessage(error));
    }
  }

  const meetingValue = discovery?.meetingAt
    ? new Date(discovery.meetingAt).toISOString().slice(0, 16)
    : "";

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4 rounded-lg border p-4">
      <p className="text-sm font-medium">Discovery call</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="meetingAt">
            Meeting date & time
          </FieldLabel>
          <Input
            id="meetingAt"
            name="meetingAt"
            type="datetime-local"
            defaultValue={meetingValue}
            disabled={!canWrite}
          />
          <FieldError error={errors.meetingAt} />
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="meetingLink">
            Meeting link
          </FieldLabel>
          <Input
            id="meetingLink"
            name="meetingLink"
            defaultValue={discovery?.meetingLink ?? ""}
            maxLength={500}
            disabled={!canWrite}
          />
          <FieldError error={errors.meetingLink} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor="notes">
          Discovery notes
        </FieldLabel>
        <Textarea
          id="notes"
          name="notes"
          rows={4}
          maxLength={5000}
          defaultValue={discovery?.notes ?? ""}
          disabled={!canWrite}
        />
        <FieldError error={errors.notes} />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Checklist</p>
        {(Object.keys(CHECKLIST_LABELS) as Array<keyof DiscoveryChecklist>).map((key) => (
          <div key={key} className="flex items-center gap-2">
            <Checkbox
              id={key}
              name={key}
              defaultChecked={checklist[key]}
              disabled={!canWrite}
            />
            <Label htmlFor={key} className="font-normal">
              {CHECKLIST_LABELS[key]}
            </Label>
          </div>
        ))}
      </div>
      {canWrite ? (
        <Button type="submit" size="sm" className="self-start" disabled={save.isPending}>
          {save.isPending ? <Loader2Icon className="size-4 animate-spin" /> : null}
          Save discovery
        </Button>
      ) : null}
    </form>
  );
}
