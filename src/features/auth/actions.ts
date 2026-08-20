"use server";

import { redirect } from "next/navigation";

import { changePasswordSchema, signInSchema } from "@/features/auth/schemas/auth.schema";
import { auth } from "@/lib/auth/server";

export type AuthActionState = { error?: string };

const DASHBOARD = "/dashboard";
const SIGN_IN = "/auth/sign-in";

export async function signInAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Email and password are required." };
  }

  const { error } = await auth.signIn.email(parsed.data);
  if (error) {
    return { error: error.message ?? "Unable to sign in. Check your credentials." };
  }

  redirect(DASHBOARD);
}

export async function signOutAction() {
  await auth.signOut();
  redirect(SIGN_IN);
}

export type ChangePasswordResult = { ok: true } | { ok: false; error: string };

/**
 * Change the signed-in user's password. Uses the current session cookie to
 * identify the user; revokes other sessions so a leaked temporary password
 * cannot keep an old session alive.
 */
export async function changePasswordAction(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<ChangePasswordResult> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { error } = await auth.changePassword({
    currentPassword: parsed.data.currentPassword,
    newPassword: parsed.data.newPassword,
    revokeOtherSessions: true,
  });
  if (error) {
    return { ok: false, error: error.message ?? "Could not change your password." };
  }
  return { ok: true };
}
