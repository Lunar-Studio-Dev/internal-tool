import "server-only";

import { ClientDecision, QuotationVersionStatus } from "@/generated/prisma/enums";
import type { HandoffChecklist, ProjectHandoffSnapshot } from "@/features/projects/types";
import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";
import { memberNameMap } from "@/lib/lookups";

export type { HandoffChecklist, ProjectHandoffSnapshot };

export async function buildHandoffChecklist(pipelineId: string): Promise<{
  checklist: HandoffChecklist;
  snapshot: ProjectHandoffSnapshot;
}> {
  const pipeline = await db.pipeline.findUnique({
    where: { id: pipelineId },
    include: {
      business: {
        include: {
          contacts: { where: { isPrimary: true }, take: 1 },
        },
      },
      understanding: true,
      requirement: true,
      decision: true,
    },
  });
  if (!pipeline) throw new Error("Pipeline not found.");

  const quotation = await db.quotation.findFirst({
    where: { pipelineId, status: QuotationVersionStatus.CURRENT },
    select: { id: true, version: true, subtotal: true, initialPayment: true },
  });

  const [paymentAgg, paymentCount, resourceCount, contactCount] = await Promise.all([
    quotation
      ? db.payment.aggregate({
          where: { pipelineId, quotationId: quotation.id },
          _sum: { amount: true },
        })
      : Promise.resolve({ _sum: { amount: null } }),
    quotation
      ? db.payment.count({ where: { pipelineId, quotationId: quotation.id } })
      : Promise.resolve(0),
    db.resource.count({ where: { pipelineId } }),
    db.contact.count({ where: { businessId: pipeline.businessId } }),
  ]);

  const receivedPaise = paymentAgg._sum.amount ?? 0;
  const requiredPaise = quotation?.initialPayment ?? 0;
  const contractTotalPaise = quotation?.subtotal ?? 0;
  const primary = pipeline.business.contacts[0] ?? null;

  const checklist: HandoffChecklist = {
    businessInfo: Boolean(pipeline.business.name),
    understanding: Boolean(pipeline.understanding),
    requirements: Boolean(pipeline.requirement),
    finalQuotation: Boolean(quotation),
    initialPayment:
      pipeline.decision?.decision === ClientDecision.ACCEPTED &&
      (requiredPaise === 0 || receivedPaise >= requiredPaise),
    clientContacts: contactCount > 0,
    resources: resourceCount > 0,
  };

  const snapshot: ProjectHandoffSnapshot = {
    checklist,
    business: {
      id: pipeline.business.id,
      name: pipeline.business.name,
      email: pipeline.business.email,
      phone: pipeline.business.phone,
      primaryContact: primary
        ? { name: primary.name, email: primary.email, phone: primary.phone }
        : null,
    },
    quotation,
    payment: {
      receivedPaise,
      requiredPaise,
      count: paymentCount,
      contractTotalPaise,
      fullyPaid: contractTotalPaise === 0 || receivedPaise >= contractTotalPaise,
    },
    resourceCount,
    notes: pipeline.notes,
  };

  return { checklist, snapshot };
}

export async function getProjectForPipeline(pipelineId: string) {
  await requirePermission("project:read");
  const project = await db.project.findUnique({ where: { pipelineId } });
  if (!project) return null;
  const names = await memberNameMap([project.managerId, project.createdById]);
  const { checklist, snapshot } = await buildHandoffChecklist(pipelineId);
  return {
    ...project,
    managerName: project.managerId ? (names.get(project.managerId) ?? null) : null,
    createdByName: project.createdById ? (names.get(project.createdById) ?? null) : null,
    checklist,
    snapshot,
  };
}
export type ProjectDetail = NonNullable<Awaited<ReturnType<typeof getProjectForPipeline>>>;

export async function getProjectSetupContext(pipelineId: string) {
  await requirePermission("project:read");
  const pipeline = await db.pipeline.findUnique({
    where: { id: pipelineId },
    select: {
      id: true,
      code: true,
      name: true,
      currentPhase: true,
      status: true,
      businessId: true,
      business: { select: { name: true } },
    },
  });
  if (!pipeline) throw new Error("Pipeline not found.");

  const [project, members, handoff] = await Promise.all([
    getProjectForPipeline(pipelineId),
    db.teamMember.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    buildHandoffChecklist(pipelineId),
  ]);

  return {
    pipeline,
    project,
    members,
    checklist: handoff.checklist,
    snapshot: handoff.snapshot,
  };
}
export type ProjectSetupContext = Awaited<ReturnType<typeof getProjectSetupContext>>;
