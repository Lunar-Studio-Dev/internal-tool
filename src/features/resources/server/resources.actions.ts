"use server";

import { revalidatePath } from "next/cache";

import { createResourceSchema } from "@/features/resources/schemas/resource.schema";
import { logActivity } from "@/lib/activity";
import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";
import { deleteObject, presignDownload, publicUrl } from "@/lib/r2";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type DownloadResult = { ok: true; url: string } | { ok: false; error: string };

function emptyToNull(value?: string | null): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length ? trimmed : null;
}

function revalidateContexts(resource: { businessId: string | null; pipelineId: string | null }) {
  revalidatePath("/resources");
  if (resource.businessId) revalidatePath(`/businesses/${resource.businessId}`);
  if (resource.pipelineId) revalidatePath(`/pipelines/${resource.pipelineId}`);
}

export async function createResourceAction(input: unknown): Promise<ActionResult> {
  const member = await requirePermission("resource:write");

  const parsed = createResourceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;

  try {
    const resource = await db.resource.create({
      data: {
        name: d.name,
        type: d.type,
        objectKey: d.objectKey,
        sizeBytes: d.sizeBytes ?? null,
        contentType: emptyToNull(d.contentType),
        businessId: emptyToNull(d.businessId),
        pipelineId: emptyToNull(d.pipelineId),
        phaseType: d.phaseType ? d.phaseType : null,
        description: emptyToNull(d.description),
        createdById: member.id,
      },
    });
    await logActivity({
      actorId: member.id,
      action: "resource.created",
      entityType: "Resource",
      entityId: resource.id,
      businessId: resource.businessId,
      pipelineId: resource.pipelineId,
      metadata: { name: resource.name, type: resource.type },
    });
    revalidateContexts(resource);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save the resource." };
  }
}

/** Guarded, audited delete: removes the R2 object (best-effort) and the row. */
export async function deleteResourceAction(id: string): Promise<ActionResult> {
  const member = await requirePermission("resource:write");

  const resource = await db.resource.findUnique({ where: { id } });
  if (!resource) return { ok: false, error: "Resource not found." };

  try {
    await deleteObject(resource.objectKey);
  } catch {
    // Best-effort: proceed to remove the metadata even if the object is already gone.
  }

  await db.resource.delete({ where: { id } });
  await logActivity({
    actorId: member.id,
    action: "resource.deleted",
    entityType: "Resource",
    entityId: id,
    businessId: resource.businessId,
    pipelineId: resource.pipelineId,
    metadata: { name: resource.name },
  });
  revalidateContexts(resource);
  return { ok: true };
}

/** Short-lived download URL (public base if configured, else presigned GET). */
export async function getResourceDownloadUrlAction(id: string): Promise<DownloadResult> {
  await requirePermission("resource:read");

  const resource = await db.resource.findUnique({ where: { id } });
  if (!resource) return { ok: false, error: "Resource not found." };

  const url = publicUrl(resource.objectKey) ?? (await presignDownload(resource.objectKey));
  if (!url) return { ok: false, error: "File storage is not configured." };
  return { ok: true, url };
}
