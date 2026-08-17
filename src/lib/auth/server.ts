import "server-only";

import { createNeonAuth } from "@neondatabase/auth/next/server";

/**
 * Neon Managed Better Auth — unified server instance.
 *
 * Provides `.handler()` (API route), `.middleware()` (route protection via
 * src/proxy.ts), `.getSession()`, and the Better Auth server methods
 * (`signIn`, `signUp`, `signOut`, ...).
 *
 * Reads directly from `process.env` (rather than `@/lib/env`) so this module
 * stays lightweight for the proxy/middleware runtime. `createNeonAuth` throws
 * if the cookie secret is shorter than 32 characters.
 */
export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
});
