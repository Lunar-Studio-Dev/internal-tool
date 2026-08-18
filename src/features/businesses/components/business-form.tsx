"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { DuplicateDialog } from "@/features/businesses/components/duplicate-dialog";
import {
  createBusinessAction,
  updateBusinessAction,
} from "@/features/businesses/server/businesses.actions";
import type { DuplicateCandidate } from "@/features/businesses/server/duplicates";

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
  const [form, setForm] = useState<BusinessFormInitial>(initial);
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[] | null>(null);
  const [isPending, startTransition] = useTransition();

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

  function submit(force: boolean) {
    setError(null);
    startTransition(async () => {
      if (mode === "create") {
        const result = await createBusinessAction(buildPayload(force));
        if (result.ok) {
          setDuplicates(null);
          toast.success("Business created");
          onSuccess?.(result.id);
          router.push(`/businesses/${result.id}`);
        } else if ("duplicates" in result) {
          setDuplicates(result.duplicates);
        } else {
          setDuplicates(null);
          setError(result.error);
        }
      } else {
        const result = await updateBusinessAction(buildPayload(false));
        if (result.ok) {
          toast.success("Business updated");
          onSuccess?.(initial.id);
        } else {
          setError(result.error);
        }
      }
    });
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    submit(false);
  }

  return (
    <>
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <section className="flex flex-col gap-4">
          <h3 className="text-sm font-medium">Business information</h3>
          <div className="flex flex-col gap-2">
            <Label htmlFor="biz-name">Name</Label>
            <Input
              id="biz-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="biz-website">Website</Label>
              <Input
                id="biz-website"
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="example.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="biz-email">Email</Label>
              <Input
                id="biz-email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="biz-phone">Phone</Label>
              <Input
                id="biz-phone"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="biz-industry">Industry</Label>
              <Input
                id="biz-industry"
                value={form.industry}
                onChange={(e) => set("industry", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="biz-location">Location</Label>
              <Input
                id="biz-location"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="biz-address">Address</Label>
            <Textarea
              id="biz-address"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              rows={2}
            />
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
                  <Label htmlFor="contact-name">Name</Label>
                  <Input
                    id="contact-name"
                    value={contact.name}
                    onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="contact-email">Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contact.email}
                    onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="contact-phone">Phone</Label>
                  <Input
                    id="contact-phone"
                    value={contact.phone}
                    onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                  />
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
              <Label htmlFor="soc-linkedin">LinkedIn</Label>
              <Input
                id="soc-linkedin"
                value={form.social.linkedin}
                onChange={(e) => setSocial("linkedin", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="soc-instagram">Instagram</Label>
              <Input
                id="soc-instagram"
                value={form.social.instagram}
                onChange={(e) => setSocial("instagram", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="soc-facebook">Facebook</Label>
              <Input
                id="soc-facebook"
                value={form.social.facebook}
                onChange={(e) => setSocial("facebook", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="soc-x">X</Label>
              <Input
                id="soc-x"
                value={form.social.x}
                onChange={(e) => setSocial("x", e.target.value)}
              />
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-2">
          <Label htmlFor="biz-notes">Notes</Label>
          <Textarea
            id="biz-notes"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={3}
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
            {mode === "create" ? "Save Business" : "Save changes"}
          </Button>
        </div>
      </form>

      {duplicates ? (
        <DuplicateDialog
          candidates={duplicates}
          open={duplicates.length > 0}
          canForce={canForce}
          pending={isPending}
          onCancel={() => setDuplicates(null)}
          onForceCreate={() => submit(true)}
        />
      ) : null}
    </>
  );
}
