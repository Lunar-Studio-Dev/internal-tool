"use client";

import { MailIcon, PencilIcon, UserCheckIcon, UserXIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useResendInvite, useSetMemberStatus } from "@/features/team/api";
import type { MemberFormInitial } from "@/features/team/components/member-form";
import { MemberFormDialog } from "@/features/team/components/member-form-dialog";
import { mutationErrorMessage } from "@/lib/api/errors";
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
  const setStatus = useSetMemberStatus();
  const resendInvite = useResendInvite();
  const isPending = setStatus.isPending || resendInvite.isPending;
  const isInactive = status === MemberStatus.INACTIVE;

  async function toggleStatus() {
    try {
      await setStatus.mutateAsync({
        id,
        status: isInactive ? MemberStatus.ACTIVE : MemberStatus.INACTIVE,
      });
      toast.success(isInactive ? "Member reactivated" : "Member deactivated");
    } catch (error) {
      toast.error(mutationErrorMessage(error));
    }
  }

  async function resend() {
    try {
      const result = await resendInvite.mutateAsync(id);
      if (result.warning) toast.warning(result.warning);
      else toast.success("Invite sent");
    } catch (error) {
      toast.error(mutationErrorMessage(error));
    }
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
