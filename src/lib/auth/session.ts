import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/server";

/**
 * Session helpers for Server Components, Server Actions, and Route Handlers.
 *
 * NOTE: Server Components that call these must `export const dynamic = "force-dynamic"`
 * because the session is derived from cookies.
 */

// Cached per request so multiple callers (requireUser, getCurrentMember, ...)
// share a single session lookup.
export const getSession = cache(async () => {
  const { data } = await auth.getSession();
  return data ?? null;
});

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
