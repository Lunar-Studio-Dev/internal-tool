"use client";

import { type FormEvent, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { FieldError, FieldLabel } from "@/components/common/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useCreateMember, useUpdateMember } from "@/features/team/api";
import { ROLE_LABELS, ROLE_ORDER } from "@/features/team/constants";
import { createMemberSchema, updateMemberSchema } from "@/features/team/schemas/team.schema";
import { mutationErrorMessage } from "@/lib/api/errors";
import { parseForm, type FieldErrors } from "@/lib/form";
import { type RoleName } from "@/generated/prisma/enums";

export type MemberFormInitial = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  roles: RoleName[];
};

const EMPTY: MemberFormInitial = { name: "", email: "", phone: "", roles: [] };

export function MemberForm({
  mode,
  initial = EMPTY,
  onSuccess,
}: {
  mode: "create" | "edit";
  initial?: MemberFormInitial;
  onSuccess?: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [roles, setRoles] = useState<RoleName[]>(initial.roles);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const isPending = createMember.isPending || updateMember.isPending;

  function toggleRole(role: RoleName, checked: boolean) {
    setRoles((prev) =>
      checked ? Array.from(new Set([...prev, role])) : prev.filter((r) => r !== role),
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const payload = { name, email, phone, roles };
    setErrors({});
    try {
      let result;
      if (mode === "create") {
        const parsed = parseForm(createMemberSchema, payload);
        if (!parsed.ok) {
          setErrors(parsed.errors);
          return;
        }
        result = await createMember.mutateAsync(parsed.data);
      } else {
        const parsed = parseForm(updateMemberSchema, { ...payload, id: initial.id });
        if (!parsed.ok) {
          setErrors(parsed.errors);
          return;
        }
        result = await updateMember.mutateAsync(parsed.data);
      }
      if (result.warning) toast.warning(result.warning);
      else toast.success(mode === "create" ? "Member invited" : "Member updated");
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
        <FieldLabel htmlFor="member-name" required>
          Name
        </FieldLabel>
        <Input id="member-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
        <FieldError error={errors.name} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="member-email" required>
            Email
          </FieldLabel>
          <Input
            id="member-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly={mode === "edit"}
            className={mode === "edit" ? "bg-muted" : undefined}
            maxLength={200}
          />
          {mode === "edit" ? (
            <p className="text-xs text-muted-foreground">
              Email is the sign-in identity and can&apos;t be changed here.
            </p>
          ) : null}
          <FieldError error={errors.email} />
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="member-phone">Phone</FieldLabel>
          <Input
            id="member-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={40}
          />
          <FieldError error={errors.phone} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel required>Roles</FieldLabel>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ROLE_ORDER.map((role) => (
            <label
              key={role}
              className="flex items-center gap-2 rounded-md border p-2.5 text-sm"
            >
              <Checkbox
                checked={roles.includes(role)}
                onCheckedChange={(checked) => toggleRole(role, checked === true)}
              />
              {ROLE_LABELS[role]}
            </label>
          ))}
        </div>
        <FieldError error={errors.roles} />
        <p className="text-xs text-muted-foreground">
          {mode === "create"
            ? "On save, the sign-in account is created and a temporary password is emailed to the member."
            : "Permissions are inherited from the selected roles."}
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2Icon className="size-4 animate-spin" /> : null}
          {mode === "create" ? "Send invite" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
