import { realtime } from "inngest";
import { z } from "zod";

export const quotationChannel = realtime.channel({
    name: ({ quotationId }: { quotationId: string }) => `quotation:${quotationId}`,
    topics: {
        status: {
            schema: z.object({
                status: z.enum(["pending", "processing", "saving", "completed", "failed"]),
                message: z.string(),
            }),
        },
    },
});
