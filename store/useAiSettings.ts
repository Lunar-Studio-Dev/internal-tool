import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  AVAILABLE_GEMINI_MODELS,
  type AiModelType,
  type AiSettingsPayload,
} from "@/lib/ai-settings";

interface AiSettingsState {
  ai_model_type: AiModelType;
  customModelId: string;
  customApiKey: string;
  setAiModelType: (type: AiModelType) => void;
  setCustomModelId: (modelId: string) => void;
  setCustomApiKey: (apiKey: string) => void;
  resetToDefault: () => void;
  getPayload: () => AiSettingsPayload;
  isCustomReady: () => boolean;
}

const DEFAULT_CUSTOM_MODEL = AVAILABLE_GEMINI_MODELS[0].id;

export const useAiSettings = create<AiSettingsState>()(
  persist(
    (set, get) => ({
      ai_model_type: "default",
      customModelId: DEFAULT_CUSTOM_MODEL,
      customApiKey: "",

      setAiModelType: (type) => set({ ai_model_type: type }),
      setCustomModelId: (modelId) => set({ customModelId: modelId }),
      setCustomApiKey: (apiKey) => set({ customApiKey: apiKey }),

      resetToDefault: () =>
        set({
          ai_model_type: "default",
          customModelId: DEFAULT_CUSTOM_MODEL,
          customApiKey: "",
        }),

      getPayload: () => {
        const state = get();
        if (state.ai_model_type === "custom") {
          return {
            type: "custom",
            modelId: state.customModelId,
            apiKey: state.customApiKey.trim(),
          };
        }
        return { type: "default" };
      },

      isCustomReady: () => {
        const state = get();
        return (
          state.ai_model_type === "default" ||
          (!!state.customModelId.trim() && !!state.customApiKey.trim())
        );
      },
    }),
    {
      name: "ai-settings-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        ai_model_type: state.ai_model_type,
        customModelId: state.customModelId,
        customApiKey: state.customApiKey,
      }),
    }
  )
);
