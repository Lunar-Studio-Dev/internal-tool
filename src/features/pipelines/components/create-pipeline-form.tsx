"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  BusinessCombobox,
  type BusinessOption,
} from "@/features/pipelines/components/business-combobox";
import { LEAD_SOURCE_LABELS, LEAD_SOURCE_ORDER } from "@/features/pipelines/constants";
import { createPipelineAction } from "@/features/pipelines/server/pipelines.actions";
import { LeadSource } from "@/generated/prisma/enums";

export type AssigneeOption = { id: string; name: string };

const UNASSIGNED = "UNASSIGNED";

export function CreatePipelineForm({
  businesses,
  assignees,
  fixedBusiness,
}: {
  businesses: BusinessOption[];
  assignees: AssigneeOption[];
  fixedBusiness?: { id: string; name: string } | null;
}) {
  const router = useRouter();
  const [businessId, setBusinessId] = useState<string | null>(fixedBusiness?.id ?? null);
  const [name, setName] = useState("");
  const [opportunityType, setOpportunityType] = useState("");
  const [leadSource, setLeadSource] = useState<LeadSource>(LeadSource.WEBSITE);
  const [ownerId, setOwnerId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!businessId) {
      setError("Select a business for this pipeline.");
      return;
    }
    startTransition(async () => {
      const result = await createPipelineAction({
        businessId,
        name,
        opportunityType,
        leadSource,
        ownerId,
        notes,
      });
      if (result.ok) {
        toast.success("Pipeline created");
        router.push(`/pipelines/${result.id}`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label>Business</Label>
        {fixedBusiness ? (
          <Input value={fixedBusiness.name} readOnly className="bg-muted" />
        ) : (
          <BusinessCombobox options={businesses} value={businessId} onChange={setBusinessId} />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="pl-name">Pipeline name</Label>
        <Input id="pl-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="pl-opp">Opportunity type</Label>
          <Input
            id="pl-opp"
            value={opportunityType}
            onChange={(e) => setOpportunityType(e.target.value)}
            placeholder="e.g. ERP Automation"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pl-lead">Lead source</Label>
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
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="pl-owner">Assigned to</Label>
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
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="pl-notes">Notes</Label>
        <Textarea id="pl-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </div>

      <p className="text-xs text-muted-foreground">
        Initial phase: <span className="font-medium">Discovery</span> · Initial status:{" "}
        <span className="font-medium">Active</span>
      </p>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" disabled={isPending} onClick={() => router.back()}>
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
