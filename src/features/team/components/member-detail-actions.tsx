"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { MailIcon, PencilIcon, UserCheckIcon, UserXIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { MemberFormInitial } from "@/features/team/components/member-form";
import { MemberFormDialog } from "@/features/team/components/member-form-dialog";
import {
  resendInviteAction,
  setMemberStatusAction,
} from "@/features/team/server/team.actions";
import { MemberStatus } from "@/generated/prisma/enums";

export function MemberDetailActions({
  id,
  status,
  initial,
}: {
  id: string;
  status: MemberStatus;
  initial: MemberFormInitial;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isInactive = status === MemberStatus.INACTIVE;

  function toggleStatus() {
    startTransition(async () => {
      const result = await setMemberStatusAction(
        id,
        isInactive ? MemberStatus.ACTIVE : MemberStatus.INACTIVE,
      );
      if (result.ok) toast.success(isInactive ? "Member reactivated" : "Member deactivated");
      else toast.error(result.error);
      router.refresh();
    });
  }

  function resend() {
    startTransition(async () => {
      const result = await resendInviteAction(id);
      if (result.ok) {
        if (result.warning) toast.warning(result.warning);
        else toast.success("Invite sent");
      } else {
        toast.error(result.error);
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      {status === MemberStatus.PENDING ? (
        <Button variant="outline" disabled={isPending} onClick={resend}>
          <MailIcon className="size-4" />
          Resend invite
        </Button>
      ) : null}
      <Button variant="outline" disabled={isPending} onClick={toggleStatus}>
        {isInactive ? (
          <>
            <UserCheckIcon className="size-4" />
            Reactivate
          </>
        ) : (
          <>
            <UserXIcon className="size-4" />
            Deactivate
          </>
        )}
      </Button>
      <MemberFormDialog
        mode="edit"
        initial={initial}
        trigger={
          <Button>
            <PencilIcon className="size-4" />
            Edit Member
          </Button>
        }
      />
    </div>
  );
}
