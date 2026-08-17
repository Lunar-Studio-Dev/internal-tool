import { auth } from "@/lib/auth/server";

// Catch-all proxy for all Managed Better Auth API calls (sign-in, session,
// OAuth callbacks, verification, password reset). Public sign-up is disabled —
// members are provisioned by an admin (see team.actions.ts), never self-served.
const handlers = auth.handler();

export const GET = handlers.GET;

type RouteContext = { params: Promise<{ path: string[] }> };

export async function POST(request: Request, context: RouteContext) {
  const { path } = await context.params;
  if (path?.[0] === "sign-up") {
    return Response.json(
      { error: "Public sign-up is disabled. Contact an administrator for access." },
      { status: 403 },
    );
  }
  return handlers.POST(request, context);
}
