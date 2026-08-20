"use client";

import Link from "next/link";
import { EllipsisVerticalIcon, EyeIcon, MailIcon, UserCheckIcon, UserXIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useResendInvite, useSetMemberStatus } from "@/features/team/api";
import { mutationErrorMessage } from "@/lib/api/errors";
import { MemberStatus } from "@/generated/prisma/enums";

export function MemberRowActions({ id, status }: { id: string; status: MemberStatus }) {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" aria-label="Member actions">
          <EllipsisVerticalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/team/${id}`}>
            <EyeIcon className="size-4" />
            View details
          </Link>
        </DropdownMenuItem>
        {status === MemberStatus.PENDING ? (
          <DropdownMenuItem
            disabled={isPending}
            onSelect={(event) => {
              event.preventDefault();
              resend();
            }}
          >
            <MailIcon className="size-4" />
            Resend invite
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          disabled={isPending}
          onSelect={(event) => {
            event.preventDefault();
            toggleStatus();
          }}
        >
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
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
