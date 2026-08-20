"use client";

import { type ReactNode, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ContactForm,
  type ContactFormInitial,
} from "@/features/businesses/components/contact-form";

export function ContactFormDialog({
  mode,
  businessId,
  initial,
  lockPrimary,
  trigger,
}: {
  mode: "create" | "edit";
  businessId: string;
  initial?: ContactFormInitial;
  lockPrimary?: boolean;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add contact" : "Edit contact"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a person at this business."
              : "Update this contact's details."}
          </DialogDescription>
        </DialogHeader>
        <ContactForm
          mode={mode}
          businessId={businessId}
          initial={initial}
          lockPrimary={lockPrimary}
          onSuccess={() => {
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
