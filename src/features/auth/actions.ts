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

export async function signUpAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    return { error: "Name, email, and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const { error } = await auth.signUp.email({ name, email, password });
  if (error) {
    return { error: error.message ?? "Unable to create your account." };
  }

  redirect(DASHBOARD);
}

export async function signOutAction() {
  await auth.signOut();
  redirect(SIGN_IN);
}
