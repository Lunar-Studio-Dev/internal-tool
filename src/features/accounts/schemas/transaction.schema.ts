import { z } from "zod";

import { EARNING_CATEGORY_OPTIONS } from "@/features/accounts/constants";
import { ExpenseCategory, TransactionType } from "@/generated/prisma/enums";
import { optionalText, requiredDateTime } from "@/lib/zod-fields";

const EXPENSE_CATEGORIES = Object.values(ExpenseCategory) as [
  ExpenseCategory,
  ...ExpenseCategory[],
];

export const addTransactionSchema = z
  .object({
    type: z.enum([TransactionType.EARNING, TransactionType.EXPENSE]),
    amountPaise: z.coerce.number().int().positive("Amount must be greater than zero"),
    date: requiredDateTime,
    category: optionalText(100),
    expenseCategory: z.enum(EXPENSE_CATEGORIES).optional(),
    description: optionalText(500),
    reference: optionalText(200),
    businessId: z.string().min(1).optional().or(z.literal("")),
    pipelineId: z.string().min(1).optional().or(z.literal("")),
    quotationId: z.string().min(1).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.type === TransactionType.EXPENSE && !data.expenseCategory) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pick an expense category",
        path: ["expenseCategory"],
      });
    }
    if (data.type === TransactionType.EARNING && data.category) {
      if (!EARNING_CATEGORY_OPTIONS.includes(data.category as (typeof EARNING_CATEGORY_OPTIONS)[number])) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid earning category",
          path: ["category"],
        });
      }
    }
  });

export type AddTransactionInput = z.infer<typeof addTransactionSchema>;

export type TransactionListFilters = {
  type?: TransactionType | "ALL";
  businessId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
};
