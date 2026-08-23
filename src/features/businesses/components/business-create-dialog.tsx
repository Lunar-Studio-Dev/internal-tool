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
import { BusinessCreateWizard } from "@/features/businesses/components/business-create-wizard";

export function BusinessCreateDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New business</DialogTitle>
          <DialogDescription>
            Add a client in three steps. We&apos;ll check for possible duplicates on save.
          </DialogDescription>
        </DialogHeader>
        <BusinessCreateWizard onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
