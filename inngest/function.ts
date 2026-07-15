// src/inngest/functions.ts
import { getSystemPrompt } from "@/lib/utils";
import inngestClient from "./client";
import { generateText } from "ai";
import { google } from "@/ai";
import { quotationChannel } from "./channels/quotation";

export const generateQuotation = inngestClient.createFunction(
    { id: "generate-quotation", triggers: { event: "app/generate-quotation" } },
    async ({ event, step }) => {

        const { quotationId, template, requirements, quotationWebhookUrl } = event.data;

        const ch = quotationChannel({ quotationId });

        // ── Status: Processing (before AI call) ──
        await step.realtime.publish("status-processing", ch.status, {
            status: "processing",
            message: "Generating proposal using AI..."
        });

        // ── AI Generation ──
        const aiContent = await step.run("generate-ai-content", async () => {
            const res = await generateText({
                model: google("gemini-2.5-flash"),
                prompt: `
                # TEMPLATE
                ${template}

                # REQUIREMENTS
                ${requirements}
                `,
                instructions: getSystemPrompt()
            });
            if (!res.text) {
                throw new Error("AI returned empty content");
            }
            return res.text;
        });

        // ── Status: Saving (before DB save) ──
        await step.realtime.publish("status-saving", ch.status, {
            status: "saving",
            message: "Saving generated content to database..."
        });

        // ── Save content + set status to "completed" ──
        await step.run("save-quotation-content", async () => {
            const response = await fetch(quotationWebhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    quotationId,
                    content: aiContent,
                    status: "completed",
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error("Failed to save quotation: " + (data.error || "unknown"));
            }

            return data;
        });

        // ── Status: Completed ──
        await step.realtime.publish("status-completed", ch.status, {
            status: "completed",
            message: "Quotation generated successfully!"
        });

        return { success: true };
    }
);