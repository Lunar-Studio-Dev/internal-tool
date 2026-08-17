"use server";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/server";

export type AuthActionState = { error?: string };

const DASHBOARD = "/dashboard";
const SIGN_IN = "/auth/sign-in";

export async function signInAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const { error } = await auth.signIn.email({ email, password });
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
  const currentPassword = String(input.currentPassword ?? "");
  const newPassword = String(input.newPassword ?? "");

  if (!currentPassword || !newPassword) {
    return { ok: false, error: "Current and new passwords are required." };
  }
  if (newPassword.length < 8) {
    return { ok: false, error: "New password must be at least 8 characters." };
  }
  if (newPassword === currentPassword) {
    return { ok: false, error: "New password must be different from the current one." };
  }

  const { error } = await auth.changePassword({
    currentPassword,
    newPassword,
    revokeOtherSessions: true,
  });
  if (error) {
    return { ok: false, error: error.message ?? "Could not change your password." };
  }
  return { ok: true };
}
