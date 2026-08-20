"use client";

import { type FormEvent, useState } from "react";
import { Loader2Icon, PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { FieldError, FieldLabel } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSaveUnderstanding, type PhaseDataDto } from "@/features/phases/api";
import { saveUnderstandingSchema } from "@/features/phases/schemas/phase.schema";
import { mutationErrorMessage } from "@/lib/api/errors";
import { parseForm, type FieldErrors } from "@/lib/form";

function StringListField({
  label,
  name,
  values,
  canWrite,
}: {
  label: string;
  name: string;
  values: string[];
  canWrite: boolean;
}) {
  const [items, setItems] = useState(values.length ? values : [""]);

  return (
    <div className="flex flex-col gap-2">
      <FieldLabel>{label}</FieldLabel>
      {items.map((item, index) => (
        <div key={`${name}-${index}`} className="flex gap-2">
          <Input
            name={`${name}.${index}`}
            defaultValue={item}
            maxLength={500}
            disabled={!canWrite}
            onChange={(e) => {
              const next = [...items];
              next[index] = e.target.value;
              setItems(next);
            }}
          />
          {canWrite && items.length > 1 ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setItems(items.filter((_, i) => i !== index))}
            >
              <XIcon className="size-4" />
            </Button>
          ) : null}
        </div>
      ))}
      {canWrite ? (
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setItems([...items, ""])}>
          <PlusIcon className="size-4" />
          Add
        </Button>
      ) : null}
    </div>
  );
}

export function UnderstandingForm({
  pipelineId,
  understanding,
  canWrite,
}: {
  pipelineId: string;
  understanding: PhaseDataDto["understanding"];
  canWrite: boolean;
}) {
  const save = useSaveUnderstanding(pipelineId);
  const [errors, setErrors] = useState<FieldErrors>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canWrite) return;
    const data = new FormData(e.currentTarget);
    const collect = (prefix: string) =>
      Array.from(data.entries())
        .filter(([k]) => k.startsWith(`${prefix}.`))
        .map(([, v]) => String(v).trim())
        .filter(Boolean);

    const parsed = parseForm(saveUnderstandingSchema.omit({ pipelineId: true }), {
      model: String(data.get("model") ?? ""),
      operations: String(data.get("operations") ?? ""),
      processes: String(data.get("processes") ?? ""),
      painPoints: collect("painPoints"),
      opportunities: collect("opportunities"),
      stakeholders: collect("stakeholders"),
    });
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    try {
      await save.mutateAsync(parsed.data);
      toast.success("Understanding saved");
    } catch (error) {
      toast.error(mutationErrorMessage(error));
    }
  }

  const painPoints = (understanding?.painPoints as string[] | null) ?? [];
  const opportunities = (understanding?.opportunities as string[] | null) ?? [];
  const stakeholders = (understanding?.stakeholders as string[] | null) ?? [];

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4 rounded-lg border p-4">
      <p className="text-sm font-medium">Business understanding</p>
      {(["model", "operations", "processes"] as const).map((field) => (
        <div key={field} className="flex flex-col gap-2">
          <FieldLabel htmlFor={field}>
            {field === "model" ? "What does the business do?" : field === "operations" ? "How does it operate?" : "Current processes"}
          </FieldLabel>
          <Textarea
            id={field}
            name={field}
            rows={3}
            maxLength={5000}
            defaultValue={understanding?.[field] ?? ""}
            disabled={!canWrite}
          />
          <FieldError error={errors[field]} />
        </div>
      ))}
      <div className="grid gap-4 md:grid-cols-2">
        <StringListField label="Problems / pain points" name="painPoints" values={painPoints} canWrite={canWrite} />
        <StringListField label="Opportunities" name="opportunities" values={opportunities} canWrite={canWrite} />
      </div>
      <StringListField label="Stakeholders" name="stakeholders" values={stakeholders} canWrite={canWrite} />
      {canWrite ? (
        <Button type="submit" size="sm" className="self-start" disabled={save.isPending}>
          {save.isPending ? <Loader2Icon className="size-4 animate-spin" /> : null}
          Save understanding
        </Button>
      ) : null}
    </form>
  );
}
