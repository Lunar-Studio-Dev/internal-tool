-- Phase 9 — pipeline reactivation & re-entry.
-- Adds reactivation stamps + deactivate/reactivate cycle counters to the pipeline.
-- Idempotent (ADD COLUMN IF NOT EXISTS) to match repo convention and tolerate partial applies.

ALTER TABLE "pipeline" ADD COLUMN IF NOT EXISTS "reactivatedAt" TIMESTAMP(3);
ALTER TABLE "pipeline" ADD COLUMN IF NOT EXISTS "reactivatedById" TEXT;
ALTER TABLE "pipeline" ADD COLUMN IF NOT EXISTS "deactivationCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "pipeline" ADD COLUMN IF NOT EXISTS "reactivationCount" INTEGER NOT NULL DEFAULT 0;

-- Backfill: pipelines already deactivated count as one deactivation cycle.
UPDATE "pipeline" SET "deactivationCount" = 1 WHERE "deactivatedAt" IS NOT NULL AND "deactivationCount" = 0;
