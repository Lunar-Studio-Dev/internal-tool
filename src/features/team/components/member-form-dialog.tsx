"use client";

import { type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MemberForm, type MemberFormInitial } from "@/features/team/components/member-form";

export function MemberFormDialog({
  trigger,
  mode,
  initial,
}: {
  trigger: ReactNode;
  mode: "create" | "edit";
  initial?: MemberFormInitial;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add team member" : "Edit member"}</DialogTitle>
          <DialogDescription>
            Members sign in with this email; roles define their access.
          </DialogDescription>
        </DialogHeader>
        <MemberForm
          mode={mode}
          initial={initial}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
