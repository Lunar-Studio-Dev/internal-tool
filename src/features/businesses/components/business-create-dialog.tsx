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
import { BusinessForm } from "@/features/businesses/components/business-form";

export function BusinessCreateDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New business</DialogTitle>
          <DialogDescription>
            Create a permanent client record. We&apos;ll check for possible duplicates on save.
          </DialogDescription>
        </DialogHeader>
        <BusinessForm mode="create" onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
