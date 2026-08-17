import "server-only";

/**
 * Vercel AI Gateway access is fully wired in PHASE_7 using the `ai` SDK
 * (generateText / streamText). Model ids are gateway strings and require
 * AI_GATEWAY_API_KEY. Kept minimal here so the module resolves.
 */
export const AI_DEFAULT_MODEL = "google/gemini-3-flash";
