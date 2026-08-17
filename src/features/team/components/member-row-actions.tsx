"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { EllipsisVerticalIcon, EyeIcon, MailIcon, UserCheckIcon, UserXIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  resendInviteAction,
  setMemberStatusAction,
} from "@/features/team/server/team.actions";
import { MemberStatus } from "@/generated/prisma/enums";

export function MemberRowActions({ id, status }: { id: string; status: MemberStatus }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isInactive = status === MemberStatus.INACTIVE;

  function toggleStatus() {
    startTransition(async () => {
      const result = await setMemberStatusAction(
        id,
        isInactive ? MemberStatus.ACTIVE : MemberStatus.INACTIVE,
      );
      if (!result.ok) toast.error(result.error);
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
