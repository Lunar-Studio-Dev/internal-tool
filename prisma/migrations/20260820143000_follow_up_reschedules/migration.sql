-- Follow-up reschedule history (append-only)

CREATE TABLE IF NOT EXISTS "follow_up_reschedule" (
    "id" TEXT NOT NULL,
    "followUpId" TEXT NOT NULL,
    "previousDueAt" TIMESTAMP(3) NOT NULL,
    "newDueAt" TIMESTAMP(3) NOT NULL,
    "rescheduledById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follow_up_reschedule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "follow_up_reschedule_followUpId_idx" ON "follow_up_reschedule"("followUpId");

DO $$ BEGIN
  ALTER TABLE "follow_up_reschedule"
    ADD CONSTRAINT "follow_up_reschedule_followUpId_fkey"
    FOREIGN KEY ("followUpId") REFERENCES "follow_up"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
