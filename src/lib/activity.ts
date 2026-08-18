import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export type ActivityInput = {
  /** TeamMember id of the actor (null for system/unattributed events). */
  actorId?: string | null;
  /** Dotted verb, e.g. "business.created", "contact.primary_changed". */
  action: string;
  entityType: string;
  entityId: string;
  /** Denormalized scopes for fast per-entity timelines. */
  businessId?: string | null;
  pipelineId?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Append an audit-trail row. Called from every mutating server action (PHASE_4+).
 *
 * Best-effort by design: an audit-log failure must never fail the business
 * operation that triggered it, so errors are caught and logged, not thrown.
 */
export async function logActivity(input: ActivityInput): Promise<void> {
  try {
    await db.activityLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        businessId: input.businessId ?? null,
        pipelineId: input.pipelineId ?? null,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    console.error(`logActivity failed for "${input.action}"`, error);
  }
}
