"use client";

import { type FormEvent, useState, useTransition } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_LABELS, ROLE_ORDER } from "@/features/team/constants";
import {
  createMemberAction,
  updateMemberAction,
} from "@/features/team/server/team.actions";
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
  const [isPending, startTransition] = useTransition();

  function toggleRole(role: RoleName, checked: boolean) {
    setRoles((prev) =>
      checked ? Array.from(new Set([...prev, role])) : prev.filter((r) => r !== role),
    );
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createMemberAction({ name, email, phone, roles })
          : await updateMemberAction({ id: initial.id, name, email, phone, roles });

      if (result.ok) {
        if (result.warning) toast.warning(result.warning);
        else toast.success(mode === "create" ? "Member invited" : "Member updated");
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
        <Label htmlFor="member-name">Name</Label>
        <Input id="member-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="member-email">Email</Label>
          <Input
            id="member-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            readOnly={mode === "edit"}
            className={mode === "edit" ? "bg-muted" : undefined}
          />
          {mode === "edit" ? (
            <p className="text-xs text-muted-foreground">
              Email is the sign-in identity and can&apos;t be changed here.
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="member-phone">Phone</Label>
          <Input id="member-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Roles</Label>
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
