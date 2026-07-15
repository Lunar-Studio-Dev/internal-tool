import inngestClient from "@/inngest/client";
import { generateQuotation } from "@/inngest/function";
import { serve } from "inngest/next";

export const { GET, POST, PUT } = serve({
    client: inngestClient,
    functions: [generateQuotation],
});