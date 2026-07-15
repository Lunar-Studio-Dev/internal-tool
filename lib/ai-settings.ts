export type AiModelType = "default" | "custom";

export type AiSettingsPayload =
  | { type: "default" }
  | { type: "custom"; modelId: string; apiKey: string };

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export const AVAILABLE_GEMINI_MODELS = [
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    description: "Best price-performance for high-volume tasks",
  },
  {
    id: "gemini-2.5-flash-lite",
    label: "Gemini 2.5 Flash-Lite",
    description: "Fastest and most budget-friendly",
  },
  {
    id: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    description: "Advanced reasoning and complex tasks",
  },
  {
    id: "gemini-3.5-flash",
    label: "Gemini 3.5 Flash",
    description: "Frontier performance for agentic and coding tasks",
  },
  {
    id: "gemini-3.1-flash-lite",
    label: "Gemini 3.1 Flash-Lite",
    description: "Cost-efficient, low latency",
  },
  {
    id: "gemini-3.1-pro-preview",
    label: "Gemini 3.1 Pro (Preview)",
    description: "Advanced intelligence and complex problem-solving",
  },
] as const;

export type AvailableGeminiModelId =
  (typeof AVAILABLE_GEMINI_MODELS)[number]["id"];

const ALLOWED_MODEL_IDS = new Set<string>(
  AVAILABLE_GEMINI_MODELS.map((m) => m.id)
);

export function isAllowedGeminiModelId(modelId: string): boolean {
  return ALLOWED_MODEL_IDS.has(modelId);
}

export function normalizeAiSettings(
  input: unknown
): { ok: true; value: AiSettingsPayload } | { ok: false; error: string } {
  if (!input || typeof input !== "object") {
    return { ok: true, value: { type: "default" } };
  }

  const raw = input as Record<string, unknown>;
  const type = raw.type;

  if (type === "default" || type == null) {
    return { ok: true, value: { type: "default" } };
  }

  if (type !== "custom") {
    return { ok: false, error: "Invalid AI model type." };
  }

  const modelId = typeof raw.modelId === "string" ? raw.modelId.trim() : "";
  const apiKey = typeof raw.apiKey === "string" ? raw.apiKey.trim() : "";

  if (!modelId || !apiKey) {
    return {
      ok: false,
      error: "Custom AI settings require both a model and an API key.",
    };
  }

  if (!isAllowedGeminiModelId(modelId)) {
    return { ok: false, error: "Selected Gemini model is not supported." };
  }

  return {
    ok: true,
    value: { type: "custom", modelId, apiKey },
  };
}
