-- CreateEnum
CREATE TYPE "PhaseType" AS ENUM ('CONTACT_INFO', 'DISCOVERY', 'BUSINESS_UNDERSTANDING', 'REQUIREMENT', 'QUOTATION', 'PROJECT_MANAGEMENT');

-- CreateEnum
CREATE TYPE "PhaseStatus" AS ENUM ('ACTIVE', 'PROMOTED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "PipelineStatus" AS ENUM ('ACTIVE', 'DEACTIVATED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WEBSITE', 'INSTAGRAM', 'LINKEDIN', 'REFERRAL', 'DIRECT', 'COLD', 'MANUAL_RESEARCH', 'OTHER');

-- CreateTable
CREATE TABLE "pipeline" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "opportunityType" TEXT,
    "leadSource" "LeadSource" NOT NULL DEFAULT 'OTHER',
    "ownerId" TEXT,
    "notes" TEXT,
    "currentPhase" "PhaseType" NOT NULL DEFAULT 'DISCOVERY',
    "status" "PipelineStatus" NOT NULL DEFAULT 'ACTIVE',
    "deactivationReasonId" TEXT,
    "deactivatedAt" TIMESTAMP(3),
    "deactivatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_phase" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "type" "PhaseType" NOT NULL,
    "status" "PhaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "ownerId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "promotedAt" TIMESTAMP(3),
    "promotedById" TEXT,
    "promoteNotes" TEXT,
    "notes" TEXT,

    CONSTRAINT "pipeline_phase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deactivation_reason" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "deactivation_reason_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_code_key" ON "pipeline"("code");

-- CreateIndex
CREATE INDEX "pipeline_businessId_idx" ON "pipeline"("businessId");

-- CreateIndex
CREATE INDEX "pipeline_status_idx" ON "pipeline"("status");

-- CreateIndex
CREATE INDEX "pipeline_currentPhase_idx" ON "pipeline"("currentPhase");

-- CreateIndex
CREATE INDEX "pipeline_phase_pipelineId_idx" ON "pipeline_phase"("pipelineId");

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_phase_pipelineId_type_key" ON "pipeline_phase"("pipelineId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "deactivation_reason_label_key" ON "deactivation_reason"("label");

-- AddForeignKey
ALTER TABLE "pipeline" ADD CONSTRAINT "pipeline_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_phase" ADD CONSTRAINT "pipeline_phase_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "pipeline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed default deactivation reasons (idempotent).
INSERT INTO "deactivation_reason" ("id", "label", "enabled", "usageCount") VALUES
    ('dr_no_requirement', 'No current requirement', true, 0),
    ('dr_budget_issue', 'Budget issue', true, 0),
    ('dr_price_too_high', 'Price too high', true, 0),
    ('dr_client_unresponsive', 'Client unresponsive', true, 0),
    ('dr_not_target_customer', 'Not target customer', true, 0),
    ('dr_other', 'Other', true, 0)
ON CONFLICT ("label") DO NOTHING;
