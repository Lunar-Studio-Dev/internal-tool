import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  DEFAULT_GEMINI_MODEL,
  type AiSettingsPayload,
} from "@/lib/ai-settings";

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

export function resolveGoogleModel(settings?: AiSettingsPayload) {
  if (settings?.type === "custom" && settings.apiKey && settings.modelId) {
    const custom = createGoogleGenerativeAI({ apiKey: settings.apiKey });
    return custom(settings.modelId);
  }

  return google(DEFAULT_GEMINI_MODEL);
}
