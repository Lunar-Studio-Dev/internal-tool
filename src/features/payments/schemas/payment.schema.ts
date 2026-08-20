import { z } from "zod";

import { PaymentMethod } from "@/generated/prisma/enums";
import { optionalText, requiredDateTime } from "@/lib/zod-fields";

const PAYMENT_METHODS = Object.values(PaymentMethod) as [PaymentMethod, ...PaymentMethod[]];

export const recordPaymentSchema = z.object({
  pipelineId: z.string().min(1),
  amountPaise: z.coerce.number().int().positive("Amount must be greater than zero"),
  date: requiredDateTime,
  method: z.enum(PAYMENT_METHODS).default(PaymentMethod.BANK_TRANSFER),
  reference: optionalText(200),
  notes: optionalText(2000),
  createEarning: z.boolean().default(true),
});
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
