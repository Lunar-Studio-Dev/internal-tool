-- Phase 8: payment gate, earnings ledger, and project handoff.

DO $$ BEGIN
  CREATE TYPE "TransactionType" AS ENUM ('EARNING', 'EXPENSE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'UPI', 'CARD', 'CASH', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "transaction" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "businessId" TEXT,
    "pipelineId" TEXT,
    "quotationId" TEXT,
    "reference" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "payment" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "reference" TEXT,
    "notes" TEXT,
    "transactionId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "project" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "quotationId" TEXT,
    "name" TEXT NOT NULL,
    "managerId" TEXT,
    "startDate" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "notes" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "handoff" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "payment_transactionId_key" ON "payment"("transactionId");
CREATE INDEX IF NOT EXISTS "payment_pipelineId_idx" ON "payment"("pipelineId");
CREATE INDEX IF NOT EXISTS "payment_quotationId_idx" ON "payment"("quotationId");

CREATE INDEX IF NOT EXISTS "transaction_type_date_idx" ON "transaction"("type", "date");
CREATE INDEX IF NOT EXISTS "transaction_businessId_idx" ON "transaction"("businessId");
CREATE INDEX IF NOT EXISTS "transaction_pipelineId_idx" ON "transaction"("pipelineId");

CREATE UNIQUE INDEX IF NOT EXISTS "project_code_key" ON "project"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "project_pipelineId_key" ON "project"("pipelineId");
CREATE INDEX IF NOT EXISTS "project_businessId_idx" ON "project"("businessId");
CREATE INDEX IF NOT EXISTS "project_status_idx" ON "project"("status");

DO $$ BEGIN
  ALTER TABLE "transaction" ADD CONSTRAINT "transaction_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "transaction" ADD CONSTRAINT "transaction_pipelineId_fkey"
    FOREIGN KEY ("pipelineId") REFERENCES "pipeline"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "payment" ADD CONSTRAINT "payment_pipelineId_fkey"
    FOREIGN KEY ("pipelineId") REFERENCES "pipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "payment" ADD CONSTRAINT "payment_transactionId_fkey"
    FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "project" ADD CONSTRAINT "project_pipelineId_fkey"
    FOREIGN KEY ("pipelineId") REFERENCES "pipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "project" ADD CONSTRAINT "project_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
