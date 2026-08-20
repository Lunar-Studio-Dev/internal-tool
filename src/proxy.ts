import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/server";

// Next.js 16 renamed `middleware` -> `proxy`. This protects app routes and
// refreshes the session; unauthenticated users are redirected to /auth/sign-in.
const authMiddleware = auth.middleware({ loginUrl: "/auth/sign-in" });

export default async function proxy(request: NextRequest) {
  // Let Server Actions through — they enforce auth themselves. Running the auth
  // redirect on an action POST would break the action response.
  if (request.headers.has("Next-Action")) return;

  const response = await authMiddleware(request);
  const path = request.nextUrl.pathname;
  const isApi = path.startsWith("/api/") && !path.startsWith("/api/auth");
  if (isApi && response && [301, 302, 303, 307, 308].includes(response.status)) {
    const location = response.headers.get("location") ?? "";
    if (location.includes("/auth/sign-in")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  return response;
}

export const config = {
  matcher: [
    // Protect everything except the auth pages, the auth API, and Next.js static assets.
    "/((?!auth|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
