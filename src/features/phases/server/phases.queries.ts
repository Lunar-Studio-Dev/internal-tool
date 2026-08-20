import "server-only";

import { getBusinessById } from "@/features/businesses/server/businesses.queries";
import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";

export async function getContactInfoForPipeline(pipelineId: string) {
  await requirePermission("pipeline:read");
  const pipeline = await db.pipeline.findUnique({
    where: { id: pipelineId },
    select: { businessId: true },
  });
  if (!pipeline) return null;
  return getBusinessById(pipeline.businessId);
}

export async function getDiscovery(pipelineId: string) {
  await requirePermission("pipeline:read");
  return db.discovery.findUnique({ where: { pipelineId } });
}

export async function getUnderstanding(pipelineId: string) {
  await requirePermission("pipeline:read");
  return db.businessUnderstanding.findUnique({ where: { pipelineId } });
}

export async function getRequirement(pipelineId: string) {
  await requirePermission("pipeline:read");
  return db.requirement.findUnique({ where: { pipelineId } });
}

export async function listQuotations(pipelineId: string) {
  await requirePermission("pipeline:read");
  return db.quotation.findMany({
    where: { pipelineId },
    orderBy: { version: "desc" },
  });
}

export async function getPipelineDecision(pipelineId: string) {
  await requirePermission("pipeline:read");
  return db.pipelineDecision.findUnique({ where: { pipelineId } });
}

export async function getPhasePayloads(pipelineId: string) {
  await requirePermission("pipeline:read");
  const [discovery, understanding, requirement, quotations, decision] = await Promise.all([
    getDiscovery(pipelineId),
    getUnderstanding(pipelineId),
    getRequirement(pipelineId),
    listQuotations(pipelineId),
    getPipelineDecision(pipelineId),
  ]);
  return { discovery, understanding, requirement, quotations, decision };
}

export type PhasePayloads = Awaited<ReturnType<typeof getPhasePayloads>>;
