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
import { DuplicateDialog } from "@/features/businesses/components/duplicate-dialog";
import { useCreateBusiness, useUpdateBusiness } from "@/features/businesses/api";
import {
  createBusinessSchema,
  updateBusinessSchema,
} from "@/features/businesses/schemas/business.schema";
import type { DuplicateCandidate } from "@/features/businesses/types";
import { useCurrentMember } from "@/features/team/hooks/use-current-member";
import { ApiError } from "@/lib/api/client";
import { mutationErrorMessage } from "@/lib/api/errors";
import { parseForm, type FieldErrors } from "@/lib/form";

export type BusinessFormInitial = {
  id?: string;
  name: string;
  website: string;
  email: string;
  phone: string;
  industry: string;
  location: string;
  address: string;
  notes: string;
  social: { linkedin: string; instagram: string; facebook: string; x: string };
};

const EMPTY: BusinessFormInitial = {
  name: "",
  website: "",
  email: "",
  phone: "",
  industry: "",
  location: "",
  address: "",
  notes: "",
  social: { linkedin: "", instagram: "", facebook: "", x: "" },
};

export function BusinessForm({
  mode,
  initial = EMPTY,
  canForce = false,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  initial?: BusinessFormInitial;
  /** Admin-only: allow "Create New Anyway" past the duplicate check. */
  canForce?: boolean;
  onSuccess?: (id?: string) => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const member = useCurrentMember();
  const allowForce = canForce || member.isAdmin;
  const createBusiness = useCreateBusiness();
  const updateBusiness = useUpdateBusiness();
  const [form, setForm] = useState<BusinessFormInitial>(initial);
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[] | null>(null);
  const isPending = createBusiness.isPending || updateBusiness.isPending;

  function set<K extends keyof BusinessFormInitial>(key: K, value: BusinessFormInitial[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }
  function setSocial(key: keyof BusinessFormInitial["social"], value: string) {
    setForm((prev) => ({ ...prev, social: { ...prev.social, [key]: value } }));
  }

  function buildPayload(force: boolean) {
    const base = {
      name: form.name,
      website: form.website,
      email: form.email,
      phone: form.phone,
      industry: form.industry,
      location: form.location,
      address: form.address,
      notes: form.notes,
      social: form.social,
    };
    if (mode === "edit") return { ...base, id: initial.id };
    return { ...base, contact, force };
  }

  async function submit(force: boolean) {
    setError(null);
    const payload = buildPayload(force);
    setErrors({});
    try {
      if (mode === "create") {
        const parsed = parseForm(createBusinessSchema, payload);
        if (!parsed.ok) {
          setErrors(parsed.errors);
          return;
        }
        const result = await createBusiness.mutateAsync(parsed.data);
        setDuplicates(null);
        toast.success("Business created");
        onSuccess?.(result.id);
        if (result.id) router.push(`/businesses/${result.id}`);
      } else {
        const parsed = parseForm(updateBusinessSchema, payload);
        if (!parsed.ok) {
          setErrors(parsed.errors);
          return;
        }
        await updateBusiness.mutateAsync(parsed.data);
        toast.success("Business updated");
        onSuccess?.(initial.id);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const body = err.body as { duplicates?: DuplicateCandidate[] } | undefined;
        setDuplicates(body?.duplicates ?? []);
        return;
      }
      setDuplicates(null);
      setError(mutationErrorMessage(err));
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    submit(false);
  }

  return (
    <>
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
                placeholder="example.com"
                maxLength={300}
              />
              <FieldError error={errors.website} />
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
              <FieldError error={errors.email} />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="biz-phone">Phone</FieldLabel>
              <Input
                id="biz-phone"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                maxLength={40}
              />
              <FieldError error={errors.phone} />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="biz-industry">Industry</FieldLabel>
              <Input
                id="biz-industry"
                value={form.industry}
                onChange={(e) => set("industry", e.target.value)}
                maxLength={120}
              />
              <FieldError error={errors.industry} />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="biz-location">Location</FieldLabel>
              <Input
                id="biz-location"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                maxLength={160}
              />
              <FieldError error={errors.location} />
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
            <FieldError error={errors.address} />
          </div>
        </section>

        {mode === "create" ? (
          <>
            <Separator />
            <section className="flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-medium">Primary contact</h3>
                <p className="text-xs text-muted-foreground">
                  Every business starts with one primary contact. You can add more later.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="contact-name" required>
                    Name
                  </FieldLabel>
                  <Input
                    id="contact-name"
                    value={contact.name}
                    onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                    maxLength={120}
                  />
                  <FieldError error={errors["contact.name"]} />
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="contact-email" required>
                    Email
                  </FieldLabel>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contact.email}
                    onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                    maxLength={200}
                  />
                  <FieldError error={errors["contact.email"]} />
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="contact-phone">Phone</FieldLabel>
                  <Input
                    id="contact-phone"
                    value={contact.phone}
                    onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                    maxLength={40}
                  />
                  <FieldError error={errors["contact.phone"]} />
                </div>
              </div>
            </section>
          </>
        ) : null}

        <Separator />
        <section className="flex flex-col gap-4">
          <h3 className="text-sm font-medium">Social</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="soc-linkedin">LinkedIn</FieldLabel>
              <Input
                id="soc-linkedin"
                value={form.social.linkedin}
                onChange={(e) => setSocial("linkedin", e.target.value)}
                maxLength={300}
              />
              <FieldError error={errors["social.linkedin"]} />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="soc-instagram">Instagram</FieldLabel>
              <Input
                id="soc-instagram"
                value={form.social.instagram}
                onChange={(e) => setSocial("instagram", e.target.value)}
                maxLength={300}
              />
              <FieldError error={errors["social.instagram"]} />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="soc-facebook">Facebook</FieldLabel>
              <Input
                id="soc-facebook"
                value={form.social.facebook}
                onChange={(e) => setSocial("facebook", e.target.value)}
                maxLength={300}
              />
              <FieldError error={errors["social.facebook"]} />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="soc-x">X</FieldLabel>
              <Input
                id="soc-x"
                value={form.social.x}
                onChange={(e) => setSocial("x", e.target.value)}
                maxLength={300}
              />
              <FieldError error={errors["social.x"]} />
            </div>
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
          <FieldError error={errors.notes} />
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
            {mode === "create" ? "Save Business" : "Save changes"}
          </Button>
        </div>
      </form>

      {duplicates ? (
        <DuplicateDialog
          candidates={duplicates}
          open={duplicates.length > 0}
          canForce={allowForce}
          pending={isPending}
          onCancel={() => setDuplicates(null)}
          onForceCreate={() => submit(true)}
        />
      ) : null}
    </>
  );
}
