import "server-only";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/server";

/**
 * Session helpers for Server Components, Server Actions, and Route Handlers.
 *
 * NOTE: Server Components that call these must `export const dynamic = "force-dynamic"`
 * because the session is derived from cookies.
 */

export async function getSession() {
  const { data } = await auth.getSession();
  return data ?? null;
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/** Redirects to the sign-in page when there is no authenticated user. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in");
  return user;
}
