import { getSystemPrompt } from "@/lib/utils";
import inngestClient from "./client";
import { generateText } from "ai";
import { resolveGoogleModel } from "@/ai";
import { quotationChannel } from "./channels/quotation";
import type { AiSettingsPayload } from "@/lib/ai-settings";

async function markQuotationFailed(
  quotationId: string,
  quotationWebhookUrl: string
) {
  await fetch(quotationWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quotationId,
      status: "failed",
    }),
  });
}

export const generateQuotation = inngestClient.createFunction(
  {
    id: "generate-quotation",
    triggers: { event: "app/generate-quotation" },
    retries: 3,
    onFailure: async ({ event }) => {
      const original = event.data.event;
      const quotationId = original?.data?.quotationId as string | undefined;
      const quotationWebhookUrl = original?.data?.quotationWebhookUrl as
        | string
        | undefined;

      if (!quotationId || !quotationWebhookUrl) return;

      try {
        await markQuotationFailed(quotationId, quotationWebhookUrl);
      } catch (error) {
        console.error("[INNGEST onFailure] failed to mark quotation:", error);
      }
    },
  },
  async ({ event, step }) => {
    const {
      quotationId,
      template,
      requirements,
      quotationWebhookUrl,
      aiSettings,
    } = event.data as {
      quotationId: string;
      template: string;
      requirements: string;
      quotationWebhookUrl: string;
      aiSettings?: AiSettingsPayload;
    };

    const ch = quotationChannel({ quotationId });

    await step.realtime.publish("status-processing", ch.status, {
      status: "processing",
      message: "Generating proposal using AI...",
    });

    const aiContent = await step.run("generate-ai-content", async () => {
      const model = resolveGoogleModel(aiSettings);
      const res = await generateText({
        model,
        prompt: `
                # TEMPLATE
                ${template}

                # REQUIREMENTS
                ${requirements}
                `,
        instructions: getSystemPrompt(),
      });
      if (!res.text) {
        throw new Error("AI returned empty content");
      }
      return res.text;
    });

    await step.realtime.publish("status-saving", ch.status, {
      status: "saving",
      message: "Saving generated content to database...",
    });

    await step.run("save-quotation-content", async () => {
      const response = await fetch(quotationWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quotationId,
          content: aiContent,
          status: "completed",
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          "Failed to save quotation: " + (data.error || "unknown")
        );
      }

      return data;
    });

    await step.realtime.publish("status-completed", ch.status, {
      status: "completed",
      message: "Quotation generated successfully!",
    });

    return { success: true };
  }
);
