import { ApiError } from "@/lib/api/client";

export { isAbortError } from "@/lib/api/abort";

export function mutationErrorMessage(error: unknown, fallback = "Request failed") {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}
