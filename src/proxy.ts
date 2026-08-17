import type { NextRequest } from "next/server";

import { auth } from "@/lib/auth/server";

// Next.js 16 renamed `middleware` -> `proxy`. This protects app routes and
// refreshes the session; unauthenticated users are redirected to /auth/sign-in.
const authMiddleware = auth.middleware({ loginUrl: "/auth/sign-in" });

export default function proxy(request: NextRequest) {
  // Let Server Actions through — they enforce auth themselves. Running the auth
  // redirect on an action POST would break the action response.
  if (request.headers.has("Next-Action")) return;
  return authMiddleware(request);
}

export const config = {
  matcher: [
    // Protect everything except the auth pages, the auth + inngest APIs, and
    // Next.js static assets.
    "/((?!auth|api/auth|api/inngest|_next/static|_next/image|favicon.ico).*)",
  ],
};
