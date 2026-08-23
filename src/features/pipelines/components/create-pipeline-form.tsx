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
  BusinessCombobox,
  MultiCombobox,
  type BusinessOption,
} from "@/components/common/combobox";
import { useCreatePipeline } from "@/features/pipelines/api";
import { Textarea } from "@/components/ui/textarea";
import { createPipelineSchema } from "@/features/pipelines/schemas/pipeline.schema";
import { mutationErrorMessage } from "@/lib/api/errors";
import { parseForm, type FieldErrors } from "@/lib/form";

export type AssigneeOption = { id: string; name: string };

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
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const isPending = createPipeline.isPending;

  const assigneeOptions = assignees.map((m) => ({ value: m.id, label: m.name }));

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const parsed = parseForm(createPipelineSchema, {
      businessId: businessId ?? "",
      name,
      assigneeIds,
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

      <div className="flex flex-col gap-2">
        <FieldLabel>Assigned to</FieldLabel>
        <MultiCombobox
          options={assigneeOptions}
          values={assigneeIds}
          onChange={setAssigneeIds}
          placeholder="Add team member…"
        />
        <FieldError error={errors.assigneeIds} />
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor="pl-notes">Reason / notes</FieldLabel>
        <Textarea
          id="pl-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Why this pipeline exists…"
        />
        <FieldError error={errors.notes} />
      </div>

      <p className="text-xs text-muted-foreground">
        The pipeline starts at Discovery. You can promote it through phases from the pipeline detail
        page.
      </p>

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" disabled={isPending} onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2Icon className="size-4 animate-spin" /> : null}
          Create pipeline
        </Button>
      </div>
    </form>
  );
}
