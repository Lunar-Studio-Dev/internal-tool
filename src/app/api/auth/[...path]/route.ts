import { auth } from "@/lib/auth/server";

// Catch-all proxy for all Managed Better Auth API calls (sign-in/up, session,
// OAuth callbacks, verification, password reset).
export const { GET, POST } = auth.handler();
