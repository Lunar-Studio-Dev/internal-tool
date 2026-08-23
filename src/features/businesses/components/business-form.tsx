"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { FieldError, FieldLabel } from "@/components/common/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateBusiness } from "@/features/businesses/api";
import { updateBusinessSchema } from "@/features/businesses/schemas/business.schema";
import { mutationErrorMessage } from "@/lib/api/errors";
import { parseForm, type FieldErrors } from "@/lib/form";

export type BusinessFormInitial = {
  id?: string;
  name: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  social: { linkedin: string; instagram: string; facebook: string; x: string };
  sectorId: string;
  industryId: string;
  marketId: string;
  locationIds: string[];
  tagIds: string[];
  sourceCategoryId: string;
  sourceCategoryName: string;
  sourceSubCategoryId: string;
  sourceReferredByBusinessId: string;
  sourceReferenceLabel: string;
  sourceReferenceNote: string;
};

const EMPTY: BusinessFormInitial = {
  name: "",
  website: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
  social: { linkedin: "", instagram: "", facebook: "", x: "" },
  sectorId: "",
  industryId: "",
  marketId: "",
  locationIds: [],
  tagIds: [],
  sourceCategoryId: "",
  sourceCategoryName: "",
  sourceSubCategoryId: "",
  sourceReferredByBusinessId: "",
  sourceReferenceLabel: "",
  sourceReferenceNote: "",
};

/** Edit-only business form (create uses the 3-step wizard). */
export function BusinessForm({
  mode,
  initial = EMPTY,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  initial?: BusinessFormInitial;
  onSuccess?: (id?: string) => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const updateBusiness = useUpdateBusiness();
  const [form, setForm] = useState<BusinessFormInitial>(initial);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const isPending = updateBusiness.isPending;

  function set<K extends keyof BusinessFormInitial>(key: K, value: BusinessFormInitial[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }
  function setSocial(key: keyof BusinessFormInitial["social"], value: string) {
    setForm((prev) => ({ ...prev, social: { ...prev.social, [key]: value } }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (mode !== "edit" || !initial.id) return;
    setError(null);
    setErrors({});
    const payload = { ...form, id: initial.id };
    const parsed = parseForm(updateBusinessSchema, payload);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    try {
      await updateBusiness.mutateAsync(parsed.data);
      toast.success("Business updated");
      onSuccess?.(initial.id);
    } catch (err) {
      setError(mutationErrorMessage(err));
    }
  }

  if (mode === "create") {
    return (
      <p className="text-sm text-muted-foreground">
        Use New Business to open the onboarding wizard.
      </p>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-medium">Business information</h3>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="biz-name" required>
            Name
          </FieldLabel>
          <Input
            id="biz-name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            maxLength={160}
          />
          <FieldError error={errors.name} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="biz-website">Website</FieldLabel>
            <Input
              id="biz-website"
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              maxLength={300}
            />
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="biz-email">Email</FieldLabel>
            <Input
              id="biz-email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="biz-phone">Phone</FieldLabel>
            <Input
              id="biz-phone"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              maxLength={40}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="biz-address">Address</FieldLabel>
          <Textarea
            id="biz-address"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            rows={2}
            maxLength={400}
          />
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-medium">Source note</h3>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="biz-ref-note">Reference note</FieldLabel>
          <Textarea
            id="biz-ref-note"
            value={form.sourceReferenceNote}
            onChange={(e) => set("sourceReferenceNote", e.target.value)}
            rows={2}
            maxLength={1000}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Profile, source category, and taxonomy fields can be set when creating a business. Full
          edit for those fields is available from the overview after creation.
        </p>
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-medium">Social</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {(["linkedin", "instagram", "facebook", "x"] as const).map((key) => (
            <div key={key} className="flex flex-col gap-2">
              <FieldLabel htmlFor={`soc-${key}`}>{key === "x" ? "X" : key}</FieldLabel>
              <Input
                id={`soc-${key}`}
                value={form.social[key]}
                onChange={(e) => setSocial(key, e.target.value)}
                maxLength={300}
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor="biz-notes">Notes</FieldLabel>
        <Textarea
          id="biz-notes"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          maxLength={2000}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => (onCancel ? onCancel() : router.back())}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2Icon className="size-4 animate-spin" /> : null}
          Save changes
        </Button>
      </div>
    </form>
  );
}
