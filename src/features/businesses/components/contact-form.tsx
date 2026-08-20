"use client";

import { type FormEvent, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { FieldError, FieldLabel } from "@/components/common/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateContact, useUpdateContact } from "@/features/businesses/api";
import { CONTACT_ROLE_LABELS, CONTACT_ROLE_ORDER } from "@/features/businesses/constants";
import {
  createContactSchema,
  updateContactSchema,
} from "@/features/businesses/schemas/contact.schema";
import { mutationErrorMessage } from "@/lib/api/errors";
import { parseForm, type FieldErrors } from "@/lib/form";
import { ContactRole } from "@/generated/prisma/enums";

export type ContactFormInitial = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  role: ContactRole;
  isPrimary: boolean;
  notes: string;
};

const EMPTY: ContactFormInitial = {
  name: "",
  email: "",
  phone: "",
  role: ContactRole.OTHER,
  isPrimary: false,
  notes: "",
};

export function ContactForm({
  mode,
  businessId,
  initial = EMPTY,
  lockPrimary = false,
  onSuccess,
}: {
  mode: "create" | "edit";
  businessId: string;
  initial?: ContactFormInitial;
  lockPrimary?: boolean;
  onSuccess?: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [role, setRole] = useState<ContactRole>(initial.role);
  const [isPrimary, setIsPrimary] = useState(initial.isPrimary);
  const [notes, setNotes] = useState(initial.notes);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const isPending = createContact.isPending || updateContact.isPending;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const payload = { businessId, name, email, phone, role, isPrimary, notes };
    setErrors({});
    try {
      if (mode === "create") {
        const parsed = parseForm(createContactSchema, payload);
        if (!parsed.ok) {
          setErrors(parsed.errors);
          return;
        }
        await createContact.mutateAsync(parsed.data);
      } else {
        const parsed = parseForm(updateContactSchema, { ...payload, id: initial.id });
        if (!parsed.ok) {
          setErrors(parsed.errors);
          return;
        }
        await updateContact.mutateAsync(parsed.data);
      }
      toast.success(mode === "create" ? "Contact added" : "Contact updated");
      onSuccess?.();
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
        <FieldLabel htmlFor="c-name" required>
          Name
        </FieldLabel>
        <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
        <FieldError error={errors.name} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="c-email" required>
            Email
          </FieldLabel>
          <Input
            id="c-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={200}
          />
          <FieldError error={errors.email} />
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="c-phone">Phone</FieldLabel>
          <Input id="c-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} />
          <FieldError error={errors.phone} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor="c-role" required>
          Role
        </FieldLabel>
        <Select value={role} onValueChange={(v) => setRole(v as ContactRole)}>
          <SelectTrigger id="c-role">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            {CONTACT_ROLE_ORDER.map((r) => (
              <SelectItem key={r} value={r}>
                {CONTACT_ROLE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError error={errors.role} />
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor="c-notes">Notes</FieldLabel>
        <Textarea
          id="c-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          maxLength={1000}
        />
        <FieldError error={errors.notes} />
      </div>

      <label className="flex items-center gap-2 rounded-md border p-2.5 text-sm">
        <Checkbox
          checked={isPrimary}
          disabled={lockPrimary}
          onCheckedChange={(checked) => setIsPrimary(checked === true)}
        />
        Primary contact
        {lockPrimary ? (
          <span className="text-xs text-muted-foreground">
            — set another contact as primary to change this
          </span>
        ) : null}
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2Icon className="size-4 animate-spin" /> : null}
          {mode === "create" ? "Add contact" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
