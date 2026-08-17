import "server-only";

import { cache } from "react";

import type { MemberStatus, RoleName } from "@/generated/prisma/enums";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ForbiddenError, type Permission, can } from "@/lib/rbac";

export type CurrentMember = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  status: MemberStatus;
  roleNames: RoleName[];
  isAdmin: boolean;
  banned: boolean;
};

/**
 * Resolve the signed-in user to a domain TeamMember.
 *
 * Provisioned members are already linked by `authUserId`. The manually-inserted
 * bootstrap admin is lazy-linked by matching email on first sign-in. A PENDING
 * member who reaches an authenticated request has signed in with the temporary
 * password from their invite email, so they are activated (PENDING → ACTIVE).
 * Returns null with no session/member. Cached per request.
 */
export const getCurrentMember = cache(async (): Promise<CurrentMember | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const banned = Boolean((user as { banned?: boolean | null }).banned);

  let member = await db.teamMember.findUnique({ where: { authUserId: user.id } });

  // Bootstrap-admin lazy-link: claim an unlinked row whose email matches.
  if (!member && user.email) {
    const byEmail = await db.teamMember.findUnique({
      where: { email: user.email.toLowerCase() },
    });
    if (byEmail && byEmail.authUserId == null) {
      member = await db.teamMember.update({
        where: { id: byEmail.id },
        data: { authUserId: user.id, image: byEmail.image ?? user.image ?? null },
      });
    }
  }

  if (!member) return null;

  // Activation (first sign-in): a session means an invited member signed in with
  // their temporary password, so PENDING → ACTIVE.
  if (member.status === "PENDING" && !banned) {
    member = await db.teamMember.update({
      where: { id: member.id },
      data: { status: "ACTIVE" },
    });
  }

  return {
    id: member.id,
    name: member.name,
    email: member.email,
    image: member.image,
    status: member.status,
    roleNames: member.roles,
    isAdmin: member.roles.includes("ADMIN"),
    banned,
  };
});

/** True when the member may enter the app: linked, ACTIVE, and not banned. */
export function memberHasAccess(member: CurrentMember | null): member is CurrentMember {
  return !!member && member.status === "ACTIVE" && !member.banned;
}

export async function requireMember(): Promise<CurrentMember> {
  const member = await getCurrentMember();
  if (!memberHasAccess(member)) throw new ForbiddenError("access");
  return member;
}

/**
 * Server-authoritative permission gate. Admin bypasses all checks; everyone else
 * must be an ACTIVE member whose roles grant the permission (write-implies-read).
 */
export async function requirePermission(needed: Permission | (string & {})): Promise<CurrentMember> {
  const member = await requireMember();
  if (!can({ isAdmin: member.isAdmin, roleNames: member.roleNames }, needed)) {
    throw new ForbiddenError(String(needed));
  }
  return member;
}

/** Non-throwing permission check for rendering "not authorized" states in pages. */
export async function currentMemberCan(needed: Permission | (string & {})): Promise<boolean> {
  const member = await getCurrentMember();
  if (!memberHasAccess(member)) return false;
  return can({ isAdmin: member.isAdmin, roleNames: member.roleNames }, needed);
}
