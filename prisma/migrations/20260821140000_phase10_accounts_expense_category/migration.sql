-- Phase 10: expense category on transactions (idempotent for failed partial applies)
DO $$ BEGIN
  CREATE TYPE "ExpenseCategory" AS ENUM ('SOFTWARE', 'MARKETING', 'OPERATIONS', 'SALARY', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "transaction" ADD COLUMN IF NOT EXISTS "expenseCategory" "ExpenseCategory";
