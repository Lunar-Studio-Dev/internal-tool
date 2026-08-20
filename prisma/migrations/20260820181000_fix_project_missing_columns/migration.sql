-- Corrective: project table may exist from a partial apply (CREATE TABLE IF NOT EXISTS
-- skipped recreation). Add columns Prisma expects but the DB may be missing.

ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "createdById" TEXT;

ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);
UPDATE "project" SET "updatedAt" = COALESCE("createdAt", CURRENT_TIMESTAMP) WHERE "updatedAt" IS NULL;
ALTER TABLE "project" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "project" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
