import { ApiError } from "@/lib/api/client";

export { isAbortError } from "@/lib/api/abort";

const TECHNICAL_PATTERNS = [
  /<!DOCTYPE/i,
  /<html[\s>]/i,
  /Invalid `[\s\S]+` invocation/,
  /\/home\//,
  /node_modules/,
  /\.next\//,
  /Turbopack/i,
  /webpack/i,
  /PrismaClient/i,
  /PrismaClientKnownRequestError/i,
  /\bat .+\(.+:\d+:\d+\)/,
  /Unexpected token '<'/,
  /SyntaxError:/,
];

function fallbackForStatus(status?: number): string {
  if (status === 401 || status === 403) {
    return "You don't have permission to do that.";
  }
  if (status === 404) {
    return "That item could not be found.";
  }
  if (status === 409) {
    return "This conflicts with existing data.";
  }
  if (status && status >= 500) {
    return "Something went wrong on our end. Try again in a moment.";
  }
  return "Something went wrong. Check your input and try again.";
}

/** Strip HTML, stack traces, and Prisma dumps before showing errors in the UI. */
export function sanitizeErrorMessage(message: string, status?: number): string {
  const trimmed = message.trim();
  if (!trimmed) return fallbackForStatus(status);

  if (TECHNICAL_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return fallbackForStatus(status);
  }

  if (trimmed.length > 240) {
    return fallbackForStatus(status);
  }

  return trimmed;
}

export function mutationErrorMessage(error: unknown, fallback = "Request failed") {
  if (error instanceof ApiError) {
    return sanitizeErrorMessage(error.message, error.status);
  }
  if (error instanceof Error) {
    return sanitizeErrorMessage(error.message);
  }
  return fallback;
}

export function httpStatusFallback(status: number): string {
  return fallbackForStatus(status);
}
