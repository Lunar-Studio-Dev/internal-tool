// src/inngest/functions.ts
import { getSystemPrompt } from "@/lib/utils";
import inngestClient from "./client";
import { generateText } from "ai";
import { google } from "@/ai";

export const generateQuotation = inngestClient.createFunction(
    { id: "generate-quotation", triggers: { event: "app/generate-quotation" } },
    async ({ event, step }) => {

        const { name, description, templateId, userId, template, requirements, quotationWebhookUrl } = event.data

        const aiRes = await step.run("create-quotation", async () => {

            const res = await generateText({
                model: google("gemini-2.5-flash"),
                prompt: `
                # TEMPLATE
                ${template}

                # REQUIREMENTS
                ${requirements}
                `,
                instructions: getSystemPrompt()
            })
            if (!res.text) {
                throw new Error("Failed to generate quotation");
            }
            return res.text;
        })

        // const saveQuotation = await step.run("save-quotation", async)

        const saveQuotation = await step.run("save-quotation", async () => {

            const response = await fetch(quotationWebhookUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    description,
                    requirements,
                    content: aiRes,
                    templateId,
                    userId
                })
            })

            const data = await response.json()

            if (!data.success) {
                throw new Error("Failed to save quotation");
            }

            return data;
        })

        return { success: saveQuotation.success };
    }
);