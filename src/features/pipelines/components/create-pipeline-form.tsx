"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { FieldError, FieldLabel } from "@/components/common/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useCreatePipeline } from "@/features/pipelines/api";
import {
  BusinessCombobox,
  type BusinessOption,
} from "@/features/pipelines/components/business-combobox";
import { LEAD_SOURCE_LABELS, LEAD_SOURCE_ORDER } from "@/features/pipelines/constants";
import { createPipelineSchema } from "@/features/pipelines/schemas/pipeline.schema";
import { mutationErrorMessage } from "@/lib/api/errors";
import { parseForm, type FieldErrors } from "@/lib/form";
import { LeadSource } from "@/generated/prisma/enums";

export type AssigneeOption = { id: string; name: string };

const UNASSIGNED = "UNASSIGNED";

export function CreatePipelineForm({
  businesses,
  assignees,
  fixedBusiness,
  onCancel,
}: {
  businesses: BusinessOption[];
  assignees: AssigneeOption[];
  fixedBusiness?: { id: string; name: string } | null;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const createPipeline = useCreatePipeline();
  const [businessId, setBusinessId] = useState<string | null>(fixedBusiness?.id ?? null);
  const [name, setName] = useState("");
  const [opportunityType, setOpportunityType] = useState("");
  const [leadSource, setLeadSource] = useState<LeadSource>(LeadSource.WEBSITE);
  const [ownerId, setOwnerId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const isPending = createPipeline.isPending;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const parsed = parseForm(createPipelineSchema, {
      businessId: businessId ?? "",
      name,
      opportunityType,
      leadSource,
      ownerId,
      notes,
    });
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    try {
      const result = await createPipeline.mutateAsync(parsed.data);
      toast.success("Pipeline created");
      if (result.id) router.push(`/pipelines/${result.id}`);
    } catch (error) {
      setError(mutationErrorMessage(error));
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <FieldLabel required>Business</FieldLabel>
        {fixedBusiness ? (
          <Input value={fixedBusiness.name} readOnly className="bg-muted" />
        ) : (
          <BusinessCombobox options={businesses} value={businessId} onChange={setBusinessId} />
        )}
        <FieldError error={errors.businessId} />
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor="pl-name" required>
          Pipeline name
        </FieldLabel>
        <Input id="pl-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={160} />
        <FieldError error={errors.name} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="pl-opp">Opportunity type</FieldLabel>
          <Input
            id="pl-opp"
            value={opportunityType}
            onChange={(e) => setOpportunityType(e.target.value)}
            placeholder="e.g. ERP Automation"
            maxLength={160}
          />
          <FieldError error={errors.opportunityType} />
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="pl-lead" required>
            Lead source
          </FieldLabel>
          <Select value={leadSource} onValueChange={(v) => setLeadSource(v as LeadSource)}>
            <SelectTrigger id="pl-lead">
              <SelectValue placeholder="Lead source" />
            </SelectTrigger>
            <SelectContent>
              {LEAD_SOURCE_ORDER.map((source) => (
                <SelectItem key={source} value={source}>
                  {LEAD_SOURCE_LABELS[source]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError error={errors.leadSource} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor="pl-owner">Assigned to</FieldLabel>
        <Select
          value={ownerId || UNASSIGNED}
          onValueChange={(v) => setOwnerId(v === UNASSIGNED ? "" : v)}
        >
          <SelectTrigger id="pl-owner">
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
            {assignees.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError error={errors.ownerId} />
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor="pl-notes">Notes</FieldLabel>
        <Textarea
          id="pl-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={2000}
        />
        <FieldError error={errors.notes} />
      </div>

      <p className="text-xs text-muted-foreground">
        Initial phase: <span className="font-medium">Discovery</span> · Initial status:{" "}
        <span className="font-medium">Active</span>
      </p>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" disabled={isPending} onClick={() => (onCancel ? onCancel() : router.back())}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2Icon className="size-4 animate-spin" /> : null}
          Create Pipeline
        </Button>
      </div>
    </form>
  );
}
