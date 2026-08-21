import "server-only";

/**
 * Turn Prisma / driver errors into short messages safe to show in the UI.
 * Full details stay in server logs.
 */
export function friendlyDbError(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;

  const message = error.message;

  if (/column .+ does not exist/i.test(message) || /type .+ does not exist/i.test(message)) {
    return "The database is missing a recent update. Ask an admin to run migrations.";
  }

  if (
    message.includes("Invalid `") ||
    message.includes("PrismaClient") ||
    message.includes("invocation") ||
    message.length > 200 ||
    message.includes("\n")
  ) {
    console.error(error);
    return fallback;
  }

  return message;
}
