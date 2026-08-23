-- Pipeline: remove opportunityType / ownerId; add multi-assignee join table.
-- PipelinePhase: remove ownerId.

CREATE TABLE "pipeline_assignee" (
    "pipelineId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pipeline_assignee_pkey" PRIMARY KEY ("pipelineId","memberId")
);

INSERT INTO "pipeline_assignee" ("pipelineId", "memberId")
SELECT "id", "ownerId" FROM "pipeline" WHERE "ownerId" IS NOT NULL;

ALTER TABLE "pipeline_assignee" ADD CONSTRAINT "pipeline_assignee_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "pipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "pipeline_assignee_memberId_idx" ON "pipeline_assignee"("memberId");

ALTER TABLE "pipeline" DROP COLUMN IF EXISTS "opportunityType";
ALTER TABLE "pipeline" DROP COLUMN IF EXISTS "ownerId";

ALTER TABLE "pipeline_phase" DROP COLUMN IF EXISTS "ownerId";
