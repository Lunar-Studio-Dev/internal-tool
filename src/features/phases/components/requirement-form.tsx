"use client";

import { type FormEvent, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { FieldError, FieldLabel } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSaveRequirement, type PhaseDataDto } from "@/features/phases/api";
import { QUESTIONNAIRE_TEMPLATES, type QuestionnaireTemplateKey } from "@/features/phases/constants";
import { saveRequirementSchema } from "@/features/phases/schemas/phase.schema";
import { mutationErrorMessage } from "@/lib/api/errors";
import { parseForm, type FieldErrors } from "@/lib/form";

export function RequirementForm({
  pipelineId,
  requirement,
  canWrite,
}: {
  pipelineId: string;
  requirement: PhaseDataDto["requirement"];
  canWrite: boolean;
}) {
  const save = useSaveRequirement(pipelineId);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [templateKey, setTemplateKey] = useState<string>(requirement?.templateKey ?? "software_development");
  const [questionnaireDraft, setQuestionnaireDraft] = useState(
    typeof requirement?.questionnaire === "object" && requirement.questionnaire && "draft" in (requirement.questionnaire as object)
      ? String((requirement.questionnaire as { draft?: string }).draft ?? "")
      : "",
  );

  const template = QUESTIONNAIRE_TEMPLATES[templateKey as QuestionnaireTemplateKey];
  const sectionKeys = template?.sections.map((s) => s.key) ?? [];
  const questionnaire = (requirement?.questionnaire ?? {}) as Record<string, boolean>;
  const answered = sectionKeys.filter((k) => questionnaire[k]).length;
  const progress = sectionKeys.length ? Math.round((answered / sectionKeys.length) * 100) : 0;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canWrite) return;
    const data = new FormData(e.currentTarget);
    const features = String(data.get("features") ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const users = String(data.get("users") ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const parsed = parseForm(saveRequirementSchema.omit({ pipelineId: true }), {
      templateKey,
      businessReq: String(data.get("businessReq") ?? ""),
      functionalReq: String(data.get("functionalReq") ?? ""),
      technicalReq: String(data.get("technicalReq") ?? ""),
      features,
      users,
      integrations: String(data.get("integrations") ?? ""),
      timeline: String(data.get("timeline") ?? ""),
      constraints: String(data.get("constraints") ?? ""),
      questionnaire: { ...questionnaire, draft: questionnaireDraft, templateKey },
    });
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    try {
      await save.mutateAsync(parsed.data);
      toast.success("Requirements saved");
    } catch (error) {
      toast.error(mutationErrorMessage(error));
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Requirement meet</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Questionnaire progress</span>
          <Progress value={progress} className="h-1.5 w-24" />
          <span>{progress}%</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:max-w-xs">
        <FieldLabel>Template</FieldLabel>
        <Select value={templateKey} onValueChange={setTemplateKey} disabled={!canWrite}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(QUESTIONNAIRE_TEMPLATES).map(([key, t]) => (
              <SelectItem key={key} value={key}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {template ? (
        <div className="flex flex-wrap gap-2">
          {template.sections.map((section) => (
            <span
              key={section.key}
              className={`rounded-md border px-2 py-1 text-xs ${questionnaire[section.key] ? "border-primary text-foreground" : "text-muted-foreground"}`}
            >
              {questionnaire[section.key] ? "✓" : "○"} {section.label}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor="questionnaireDraft">
          Questionnaire draft
        </FieldLabel>
        <Textarea
          id="questionnaireDraft"
          rows={6}
          value={questionnaireDraft}
          onChange={(e) => setQuestionnaireDraft(e.target.value)}
          disabled={!canWrite}
          placeholder="Draft discovery questions…"
        />
      </div>

      {(
        [
          ["businessReq", "Business requirements"],
          ["functionalReq", "Functional requirements"],
          ["technicalReq", "Technical requirements"],
          ["integrations", "Integrations"],
          ["timeline", "Timeline"],
          ["constraints", "Constraints"],
        ] as const
      ).map(([field, label]) => (
        <div key={field} className="flex flex-col gap-2">
          <FieldLabel htmlFor={field}>
            {label}
          </FieldLabel>
          <Textarea
            id={field}
            name={field}
            rows={3}
            maxLength={10000}
            defaultValue={(requirement?.[field] as string | null) ?? ""}
            disabled={!canWrite}
          />
          <FieldError error={errors[field]} />
        </div>
      ))}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="features">
            Features (one per line)
          </FieldLabel>
          <Textarea
            id="features"
            name="features"
            rows={4}
            defaultValue={((requirement?.features as string[] | null) ?? []).join("\n")}
            disabled={!canWrite}
          />
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="users">
            Users (one per line)
          </FieldLabel>
          <Textarea
            id="users"
            name="users"
            rows={4}
            defaultValue={((requirement?.users as string[] | null) ?? []).join("\n")}
            disabled={!canWrite}
          />
        </div>
      </div>

      {canWrite ? (
        <Button type="submit" size="sm" className="self-start" disabled={save.isPending}>
          {save.isPending ? <Loader2Icon className="size-4 animate-spin" /> : null}
          Save requirements
        </Button>
      ) : null}
    </form>
  );
}
