"use server";

import { revalidatePath } from "next/cache";

import {
  createMemberSchema,
  updateMemberSchema,
} from "@/features/team/schemas/team.schema";
import { MemberStatus } from "@/generated/prisma/enums";
import { requirePermission } from "@/lib/auth/member";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import {
  generateTempPassword,
  isEmailConfigured,
  sendMemberInviteEmail,
} from "@/lib/email";
import { env } from "@/lib/env";

export type ActionResult =
  | { ok: true; warning?: string }
  | { ok: false; error: string };

const SIGN_IN_URL = `${env.NEXT_PUBLIC_APP_URL}/auth/sign-in`;

function isAlreadyExists(error: { message?: string; code?: string } | null | undefined) {
  if (!error) return false;
  return /exist/i.test(error.message ?? "") || /EXIST/i.test(error.code ?? "");
}

/** Look up a Neon Auth user id by email — used to recover orphaned identities. */
async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  try {
    const { data } = await auth.admin.listUsers({
      query: {
        searchField: "email",
        searchOperator: "contains",
        searchValue: email,
        limit: 20,
      },
    });
    const match = data?.users?.find(
      (user) => (user.email ?? "").toLowerCase() === email.toLowerCase(),
    );
    return match?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Provision (or recover) a Neon Auth identity for `email` and set its password to
 * `tempPassword`. Creates the user when possible; if the identity already exists
 * (orphaned from a prior run), finds it and resets the password instead.
 * Returns the auth user id, or an error string on unrecoverable failure.
 */
async function provisionAuthUser(
  email: string,
  name: string,
  tempPassword: string,
): Promise<{ userId: string } | { error: string }> {
  const created = await auth.admin.createUser({
    email,
    name,
    password: tempPassword,
    role: "user",
  });

  if (!created.error) {
    const userId = created.data?.user?.id;
    if (userId) return { userId };
    // Created without a returned id (unexpected) — fall through to lookup.
  } else if (!isAlreadyExists(created.error)) {
    return { error: created.error.message ?? "Could not provision the sign-in account." };
  }

  // Identity already exists — find it and reset the password to the new temp value.
  const userId = await findAuthUserIdByEmail(email);
  if (!userId) {
    return { error: "A sign-in account already exists for this email but could not be updated." };
  }
  const reset = await auth.admin.setUserPassword({ userId, newPassword: tempPassword });
  if (reset.error) {
    return { error: reset.error.message ?? "Could not set the temporary password." };
  }
  return { userId };
}

export async function createMemberAction(input: unknown): Promise<ActionResult> {
  await requirePermission("team:manage");

  const parsed = createMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, phone, roles } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  if (await db.teamMember.findUnique({ where: { email } })) {
    return { ok: false, error: "A member with this email already exists." };
  }

  // 1) Provision the Neon Auth identity with a generated temporary password.
  const tempPassword = generateTempPassword();
  const provisioned = await provisionAuthUser(email, name, tempPassword);
  if ("error" in provisioned) {
    return { ok: false, error: provisioned.error };
  }

  // 2) Create the domain member (PENDING until first sign-in flips it to ACTIVE).
  try {
    await db.teamMember.create({
      data: {
        authUserId: provisioned.userId,
        name,
        email,
        phone: phone ? phone : null,
        roles,
        status: MemberStatus.PENDING,
      },
    });
  } catch {
    return { ok: false, error: "A member with this email already exists." };
  }

  // 3) Email the temporary password so the member can sign in.
  const sent = await sendMemberInviteEmail({ to: email, name, tempPassword, signInUrl: SIGN_IN_URL });

  revalidatePath("/team");
  if (sent.ok) return { ok: true };
  return {
    ok: true,
    warning: isEmailConfigured()
      ? `Member created, but the invite email failed: ${sent.error} Use "Resend invite".`
      : `Member created. Email is not configured — share this temporary password securely: ${tempPassword}`,
  };
}

export async function updateMemberAction(input: unknown): Promise<ActionResult> {
  await requirePermission("team:manage");

  const parsed = updateMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { id, name, phone, roles } = parsed.data;

  try {
    await db.teamMember.update({
      where: { id },
      // email is the identity link and is not editable here; status is system-managed.
      data: { name, phone: phone ? phone : null, roles: { set: roles } },
    });
  } catch {
    return { ok: false, error: "Could not update the member." };
  }

  revalidatePath("/team");
  revalidatePath(`/team/${id}`);
  return { ok: true };
}

export async function setMemberStatusAction(
  id: string,
  status: MemberStatus,
): Promise<ActionResult> {
  await requirePermission("team:manage");
  // Admins may only deactivate/reactivate; PENDING is system-managed.
  if (status !== MemberStatus.ACTIVE && status !== MemberStatus.INACTIVE) {
    return { ok: false, error: "Invalid status" };
  }
  await db.teamMember.update({ where: { id }, data: { status } });
  revalidatePath("/team");
  revalidatePath(`/team/${id}`);
  return { ok: true };
}

/**
 * Re-issue access: generate a fresh temporary password, set it on the member's
 * Neon Auth identity (provisioning it first if missing), and email it.
 */
export async function resendInviteAction(id: string): Promise<ActionResult> {
  await requirePermission("team:manage");

  const member = await db.teamMember.findUnique({ where: { id } });
  if (!member) return { ok: false, error: "Member not found." };

  const tempPassword = generateTempPassword();

  if (member.authUserId) {
    const reset = await auth.admin.setUserPassword({
      userId: member.authUserId,
      newPassword: tempPassword,
    });
    if (reset.error) {
      return { ok: false, error: reset.error.message ?? "Could not reset the temporary password." };
    }
  } else {
    const provisioned = await provisionAuthUser(member.email, member.name, tempPassword);
    if ("error" in provisioned) {
      return { ok: false, error: provisioned.error };
    }
    await db.teamMember.update({
      where: { id },
      data: { authUserId: provisioned.userId },
    });
  }

  const sent = await sendMemberInviteEmail({
    to: member.email,
    name: member.name,
    tempPassword,
    signInUrl: SIGN_IN_URL,
  });

  revalidatePath(`/team/${id}`);
  if (sent.ok) return { ok: true };
  return {
    ok: true,
    warning: isEmailConfigured()
      ? `Password reset, but the email failed to send: ${sent.error} Please try again.`
      : `Email is not configured — share this temporary password securely: ${tempPassword}`,
  };
}
