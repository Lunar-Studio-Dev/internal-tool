"use client";

import { type FormEvent, useState, useTransition } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { CONTACT_ROLE_LABELS, CONTACT_ROLE_ORDER } from "@/features/businesses/constants";
import {
  createContactAction,
  updateContactAction,
} from "@/features/businesses/server/businesses.actions";
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
  /** True when this contact is currently the sole primary — its toggle is locked. */
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
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const payload = { businessId, name, email, phone, role, isPrimary, notes };
      const result =
        mode === "create"
          ? await createContactAction(payload)
          : await updateContactAction({ ...payload, id: initial.id });

      if (result.ok) {
        toast.success(mode === "create" ? "Contact added" : "Contact updated");
        onSuccess?.();
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
        <Label htmlFor="c-name">Name</Label>
        <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="c-email">Email</Label>
          <Input
            id="c-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="c-phone">Phone</Label>
          <Input id="c-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="c-role">Role</Label>
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
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="c-notes">Notes</Label>
        <Textarea id="c-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
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
