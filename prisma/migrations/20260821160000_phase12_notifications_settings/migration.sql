-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM ('PAYMENT', 'MEETING', 'TASK_OVERDUE', 'QUOTATION', 'PIPELINE', 'FOLLOWUP', 'SYSTEM');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "notification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "notification_recipientId_readAt_createdAt_idx" ON "notification"("recipientId", "readAt", "createdAt");

-- CreateTable
CREATE TABLE IF NOT EXISTS "app_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "companyName" TEXT NOT NULL DEFAULT 'Lunar Studio',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "dateFormat" TEXT NOT NULL DEFAULT 'DD MMM YYYY',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "staleDays" INTEGER NOT NULL DEFAULT 14,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "app_settings" ("id", "companyName", "currency", "dateFormat", "timezone", "staleDays", "updatedAt")
VALUES ('singleton', 'Lunar Studio', 'INR', 'DD MMM YYYY', 'Asia/Kolkata', 14, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
