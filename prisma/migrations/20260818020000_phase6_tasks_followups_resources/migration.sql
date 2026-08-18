-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('PDF', 'DOCX', 'IMAGE', 'TEXT', 'QUOTATION', 'REQUIREMENT', 'RESEARCH', 'MEETING_NOTES', 'OTHER');

-- CreateTable
CREATE TABLE "task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "assigneeId" TEXT,
    "createdById" TEXT,
    "dueAt" TIMESTAMP(3),
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "businessId" TEXT,
    "pipelineId" TEXT,
    "phaseType" "PhaseType",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow_up" (
    "id" TEXT NOT NULL,
    "businessId" TEXT,
    "pipelineId" TEXT,
    "phaseType" "PhaseType",
    "reason" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "assigneeId" TEXT,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follow_up_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL DEFAULT 'OTHER',
    "objectKey" TEXT NOT NULL,
    "sizeBytes" INTEGER,
    "contentType" TEXT,
    "businessId" TEXT,
    "pipelineId" TEXT,
    "phaseType" "PhaseType",
    "description" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_assigneeId_dueAt_idx" ON "task"("assigneeId", "dueAt");

-- CreateIndex
CREATE INDEX "task_status_idx" ON "task"("status");

-- CreateIndex
CREATE INDEX "task_pipelineId_idx" ON "task"("pipelineId");

-- CreateIndex
CREATE INDEX "follow_up_assigneeId_dueAt_idx" ON "follow_up"("assigneeId", "dueAt");

-- CreateIndex
CREATE INDEX "follow_up_pipelineId_idx" ON "follow_up"("pipelineId");

-- CreateIndex
CREATE INDEX "resource_businessId_idx" ON "resource"("businessId");

-- CreateIndex
CREATE INDEX "resource_pipelineId_idx" ON "resource"("pipelineId");

-- CreateIndex
CREATE INDEX "resource_type_idx" ON "resource"("type");
