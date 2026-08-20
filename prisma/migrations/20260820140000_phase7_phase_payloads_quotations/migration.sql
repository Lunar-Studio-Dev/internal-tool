-- Phase 7 payloads. Idempotent: recovers from a partial/failed earlier apply
-- where enums and some tables already exist but `discovery` may be missing.

DO $$ BEGIN
  CREATE TYPE "QuotationVersionStatus" AS ENUM ('DRAFT', 'CURRENT', 'SUPERSEDED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ClientDecision" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'LATER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "discovery" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "meetingAt" TIMESTAMP(3),
    "meetingLink" TEXT,
    "meetingOwnerId" TEXT,
    "notes" TEXT,
    "checklist" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "discovery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "business_understanding" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "model" TEXT,
    "operations" TEXT,
    "processes" TEXT,
    "painPoints" JSONB,
    "opportunities" JSONB,
    "stakeholders" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "business_understanding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "requirement" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "templateKey" TEXT,
    "businessReq" TEXT,
    "functionalReq" TEXT,
    "technicalReq" TEXT,
    "features" JSONB,
    "users" JSONB,
    "integrations" TEXT,
    "timeline" TEXT,
    "constraints" TEXT,
    "questionnaire" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "requirement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "quotation" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT,
    "scope" TEXT,
    "items" JSONB NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "initialPayment" INTEGER NOT NULL,
    "paymentTerms" TEXT,
    "validUntil" TIMESTAMP(3),
    "status" "QuotationVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "pdfResourceId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quotation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "pipeline_decision" (
    "pipelineId" TEXT NOT NULL,
    "decision" "ClientDecision" NOT NULL DEFAULT 'PENDING',
    "decidedAt" TIMESTAMP(3),
    "notes" TEXT,
    CONSTRAINT "pipeline_decision_pkey" PRIMARY KEY ("pipelineId")
);

CREATE UNIQUE INDEX IF NOT EXISTS "discovery_pipelineId_key" ON "discovery"("pipelineId");
CREATE UNIQUE INDEX IF NOT EXISTS "business_understanding_pipelineId_key" ON "business_understanding"("pipelineId");
CREATE UNIQUE INDEX IF NOT EXISTS "requirement_pipelineId_key" ON "requirement"("pipelineId");
CREATE INDEX IF NOT EXISTS "quotation_pipelineId_idx" ON "quotation"("pipelineId");
CREATE UNIQUE INDEX IF NOT EXISTS "quotation_pipelineId_version_key" ON "quotation"("pipelineId", "version");

-- Align FKs to ON DELETE CASCADE (schema intent). Drop RESTRICT leftovers from db push if present.
DO $$ BEGIN
  ALTER TABLE "discovery" DROP CONSTRAINT IF EXISTS "discovery_pipelineId_fkey";
  ALTER TABLE "discovery" ADD CONSTRAINT "discovery_pipelineId_fkey"
    FOREIGN KEY ("pipelineId") REFERENCES "pipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "business_understanding" DROP CONSTRAINT IF EXISTS "business_understanding_pipelineId_fkey";
  ALTER TABLE "business_understanding" ADD CONSTRAINT "business_understanding_pipelineId_fkey"
    FOREIGN KEY ("pipelineId") REFERENCES "pipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "requirement" DROP CONSTRAINT IF EXISTS "requirement_pipelineId_fkey";
  ALTER TABLE "requirement" ADD CONSTRAINT "requirement_pipelineId_fkey"
    FOREIGN KEY ("pipelineId") REFERENCES "pipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "quotation" DROP CONSTRAINT IF EXISTS "quotation_pipelineId_fkey";
  ALTER TABLE "quotation" ADD CONSTRAINT "quotation_pipelineId_fkey"
    FOREIGN KEY ("pipelineId") REFERENCES "pipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "pipeline_decision" DROP CONSTRAINT IF EXISTS "pipeline_decision_pipelineId_fkey";
  ALTER TABLE "pipeline_decision" ADD CONSTRAINT "pipeline_decision_pipelineId_fkey"
    FOREIGN KEY ("pipelineId") REFERENCES "pipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN others THEN NULL;
END $$;
