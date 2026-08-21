import { ExpenseCategory } from "@/generated/prisma/enums";

export const EARNING_CATEGORY_OPTIONS = [
  "Initial Payment",
  "Balance Payment",
  "Other",
] as const;

export type EarningCategory = (typeof EARNING_CATEGORY_OPTIONS)[number];

export const EXPENSE_CATEGORY_OPTIONS = Object.values(ExpenseCategory) as ExpenseCategory[];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  SOFTWARE: "Software",
  MARKETING: "Marketing",
  OPERATIONS: "Operations",
  SALARY: "Salary",
  OTHER: "Other",
};

export const TRANSACTION_TYPE_LABELS = {
  EARNING: "Income",
  EXPENSE: "Expense",
} as const;
