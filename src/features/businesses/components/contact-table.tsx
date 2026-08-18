"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { PencilIcon, PlusIcon, StarIcon } from "lucide-react";
import { toast } from "sonner";

import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ContactFormDialog,
} from "@/features/businesses/components/contact-form-dialog";
import { CONTACT_ROLE_LABELS } from "@/features/businesses/constants";
import { setPrimaryContactAction } from "@/features/businesses/server/businesses.actions";
import type { ContactRole } from "@/generated/prisma/enums";

export type ContactRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: ContactRole;
  isPrimary: boolean;
  notes: string;
};

function ContactRowActions({ businessId, contact }: { businessId: string; contact: ContactRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function makePrimary() {
    startTransition(async () => {
      const result = await setPrimaryContactAction(contact.id);
      if (result.ok) toast.success("Primary contact updated");
      else toast.error(result.error);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {!contact.isPrimary ? (
        <Button variant="ghost" size="sm" disabled={isPending} onClick={makePrimary}>
          <StarIcon className="size-4" />
          Set primary
        </Button>
      ) : null}
      <ContactFormDialog
        mode="edit"
        businessId={businessId}
        initial={{
          id: contact.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          role: contact.role,
          isPrimary: contact.isPrimary,
          notes: contact.notes,
        }}
        lockPrimary={contact.isPrimary}
        trigger={
          <Button variant="ghost" size="icon" aria-label={`Edit ${contact.name}`}>
            <PencilIcon className="size-4" />
          </Button>
        }
      />
    </div>
  );
}

export function ContactTable({
  businessId,
  contacts,
}: {
  businessId: string;
  contacts: ContactRow[];
}) {
  const columns: DataTableColumn<ContactRow>[] = [
    {
      id: "name",
      header: "Name",
      cell: (c) => (
        <span className="flex items-center gap-2 font-medium">
          {c.name}
          {c.isPrimary ? (
            <Badge variant="secondary" className="font-normal">
              Primary
            </Badge>
          ) : null}
        </span>
      ),
    },
    { id: "email", header: "Email", cell: (c) => <span className="text-muted-foreground">{c.email}</span> },
    {
      id: "phone",
      header: "Phone",
      cell: (c) => (c.phone ? c.phone : <span className="text-muted-foreground">—</span>),
    },
    { id: "role", header: "Role", cell: (c) => CONTACT_ROLE_LABELS[c.role] },
    {
      id: "actions",
      header: "",
      headerClassName: "w-40",
      className: "w-40 text-right",
      cell: (c) => <ContactRowActions businessId={businessId} contact={c} />,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <ContactFormDialog
          mode="create"
          businessId={businessId}
          trigger={
            <Button variant="outline" size="sm">
              <PlusIcon className="size-4" />
              Add contact
            </Button>
          }
        />
      </div>
      <DataTable
        columns={columns}
        data={contacts}
        getRowKey={(c) => c.id}
        empty="No contacts yet."
      />
    </div>
  );
}
